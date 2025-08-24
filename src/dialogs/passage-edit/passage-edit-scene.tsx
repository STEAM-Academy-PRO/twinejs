import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Passage, Story } from '../../store/stories';
import { useToast } from '../../components/toast';
import { usePersistence } from '../../store/persistence/use-persistence';
import Scene from './scene';
import { autoscaleSvgForPreview, cache } from '../../util/passage-render';
import { useSceneAssetBus } from './scene-asset-context';

// Module-scoped cache for downloaded/scaled SVGs by ID
const svgCache: Record<string, string> = {};

interface SvgeRequest {
  type: 'SVGE_REQUEST';
  id: string;
  method: string;
  params?: any;
}

interface SvgeResponse {
  type: 'SVGE_RESPONSE';
  id: string;
  ok: boolean;
  result?: any;
  error?: string;
}

const PassageSceneEditor: React.FC<{
  passage: Passage;
  story: Story;
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
}> = ({
  passage,
  isFullscreen,
  setIsFullscreen
}) => {

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const pending = useRef(new Map<string, (r:SvgeResponse)=>void>());
  const toast = useToast();
  const {scenes: scenesPersistence} = usePersistence();
  const [svg, setSvg] = useState<string>('');
  const assetBus = useSceneAssetBus();
  // Track the initially loaded SVG to avoid saving it back immediately
  const initialSvgRef = useRef<string | null>(null);
  if (!scenesPersistence){
    return <div>Failed to load scenes persistence</div>
  }

  useEffect(() => {
    let cancelled = false;
    const id = passage.svg;
    (async () => {
      try {
        if (id && svgCache[id]) {
          if (!cancelled) {
            setSvg(svgCache[id]);
            if (initialSvgRef.current === null) initialSvgRef.current = svgCache[id];
          }
          return;
        }
        const raw = await scenesPersistence.get(id);
        const scaled = autoscaleSvgForPreview(raw);
        svgCache[id] = scaled;
        if (!cancelled) {
          setSvg(scaled);
          if (initialSvgRef.current === null) initialSvgRef.current = scaled;
        }
      } catch (err) {
        console.error('Failed to load scene SVG', err);
        if (!cancelled) setSvg('');
      }
    })();
    return () => { cancelled = true; };
  }, [passage.svg]);



  const call = useCallback(async (method: string, params?: any) => {
    const id = Math.random().toString(36).slice(2);
    const req: SvgeRequest = { type: "SVGE_REQUEST", id, method, params };
    const win = frameRef.current?.contentWindow;

    if (!win) throw new Error("iframe not ready");

    const p = new Promise<any>((resolve, reject) => {
      pending.current.set(id, (resp) => resp.ok ? resolve(resp.result) : reject(new Error(resp.error || "SVGE error")));
    });
    // set targetOrigin to your editor’s exact origin in production
    win.postMessage(req, "*");
    return p;
  }, [svg]);


  const loadSvg = useCallback(() => {
    if (svg) call("setSvgString", { svg });
  }, [svg, call]);


  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // TODO: tighten origin check to your editor’s origin
      if (!e.data || (e.data.type !== "SVGE_RESPONSE" && e.data.type !== "SVGE_READY" && e.data.type !== "SVG_UPDATED")) return;

      if (e.data.type === "SVG_UPDATED"){
        setSvg(e.data.result);
        saveSvg(e.data.result);
        // console.log(e.data.id)
        cache[e.data.id] = e.data.result;
        toast.showInfo('SVG Updated', 500)
        return;
      }

      if (e.data.type === "SVGE_READY") {
        setReady(true);
        loadSvg()
        return;
      }

      const resp = e.data as SvgeResponse;
      const resolve = pending.current.get(resp.id);
      if (resolve) { pending.current.delete(resp.id); resolve(resp); }
    };
    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [loadSvg]);


  // Subscribe to URLs coming from the Asset Manager via the per-dialog bus
  useEffect(() => {
    const unsubscribe = assetBus.onUrl(async (url: string) => {
      // For now, we only notify and pass through to the iframe bridge if needed later
      toast.showInfo('Received asset URL', 1000);
      // console.log('[SceneEditor] Received URL from asset manager:', url);
      await call("insertSvg", {url});
      // If your SVG editor supports importing by URL via postMessage bridge,
      // call it here, e.g.: await call('importUrl', { url });
    });
    return unsubscribe;
  }, [assetBus, toast]);


  const getSvgFromEditor  = async () => {
    const rawSvg = await call("getSvgString");
    const scaled = autoscaleSvgForPreview(rawSvg)
    toast.showInfo('SVG Updated on Close', 500)
    // Update parent with exported (fixed size) SVG
    // onChange?.(exported);
    // Update local preview/cache with autoscaled SVG
    const id = passage.svg;
    if (id) svgCache[id] = scaled;
    setSvg(scaled);
  };

  // const exportSvg = (svg:string)=>{
  //   const svgDoc = new DOMParser().parseFromString(svg, "text/xml");
  //   const svgEle = svgDoc.querySelector("svg");
  //   if (!svgEle) return svg;
  //   svgEle.setAttribute("width", "1920");
  //   svgEle.setAttribute("height", "1080");
  //   svgEle.setAttribute("viewBox", "0 0 1920 1080");
  //   return new XMLSerializer().serializeToString(svgDoc);
  // }

  // const autoscaleSvg = (svg: string)=>{
  //   const svgDoc = new DOMParser().parseFromString(svg, "text/xml");
  //   const svgEle = svgDoc.querySelector("svg");
  //   if (!svgEle) return svg;
  //   svgEle.removeAttribute("width")
  //   svgEle.removeAttribute("height");
  //   svgEle.setAttribute("viewBox", "0 0 1920 1080");
  //   return new XMLSerializer().serializeToString(svgDoc);
  // }


  // Create debounced save function
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const saveSvg = useCallback(
    (svg: string) => {
      // Skip saving until we have captured the initial SVG
      if (initialSvgRef.current === null) {
        initialSvgRef.current = svg;
        return;
      }
      // Ignore saving if it matches the initial SVG (first load)
      if (svg === initialSvgRef.current) return;
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        const id = passage.svg;
        if (id) {
          scenesPersistence.save(id, svg);
        }
      }, 500); // Adjust the delay as needed
    },
    [passage.svg, scenesPersistence]
  );

  // Subscribe to svg changes
  // useEffect(() => {
  //   saveSvg(svg);
  // }, [svg, saveSvg]);



  return (
    <div
      style={{
        border: '2px solid #ccc',
        padding: '0',
        resize: 'vertical',
        overflow: 'auto',
        backgroundColor: `black`,
        position: 'relative',
      }}
      key={`svg-${passage.id}`}
    >
      {!isFullscreen && (
          <div
              className="passage-edit-svg"
            >
              <button onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? 'Exit edit' : 'Edit'}
              </button>
              <div className="preview-container">
                <Scene passage={passage}/>
              </div>
          </div>
      )}
    {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'black',
            zIndex: 1000,
            padding: 8,
            boxSizing: 'border-box',
          }}
        >
          <div className="w-full h-full flex flex-col gap-2">
            <div className="svg-menu">
              {/* <button disabled={!ready} onClick={loadSvg}>Load SVG</button>
              <button disabled={!ready} onClick={getSvg}>Get SVG</button>
              <button disabled={!ready} onClick={exportPng}>Export PNG</button>
              <button disabled={!ready} onClick={setZoom}>zoom</button>
              <button disabled={!ready} onClick={setZoom2}>zoom2</button> */}
              <button onClick={async () => {
                await getSvgFromEditor()
                setIsFullscreen(false)
              }
              }>Save and Close X</button>
            </div>

            <iframe
              ref={frameRef}
              title="SVG-Edit"
              src={`/svgedit/index_twine.html`} // see bridge below
              style={{ width: "100%", height: "85vh", border: "1px solid #333", background: "#222" }}
              sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-popups allow-modals"
            />
          </div>
        </div>
      )
    }
  </div>)
};

export default PassageSceneEditor;