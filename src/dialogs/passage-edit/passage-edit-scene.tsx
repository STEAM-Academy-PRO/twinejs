import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Passage, Story } from '../../store/stories';
import { useToast } from '../../components/toast';
import { usePersistence } from '../../store/persistence/use-persistence';


const PassageSceneEditor: React.FC<{
  disabled?: boolean;
  onChange?: (svg: string) => void;
  passage: Passage;
  story: Story;
}> = ({
  disabled: _disabled,
  onChange,
  passage,
  story: _story,
}) => {

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);
  const pending = useRef(new Map<string, (r:SvgeResponse)=>void>());
  const toast = useToast();
  const {scenes: {get: getScene}} = usePersistence()

  const svg = useMemo(async ()=>{
    console.log('getting svg:', passage.svg)
    const svg = await getScene(passage.svg)
    console.log(svg)
    return autoscaleSvg(svg)
  },[passage.svg])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // TODO: tighten origin check to your editor’s origin
      if (!e.data || (e.data.type !== "SVGE_RESPONSE" && e.data.type !== "SVGE_READY" && e.data.type !== "SVG_UPDATED")) return;

      if (e.data.type === "SVG_UPDATED"){
        onChange?.(exportSvg(e.data.result));
        toast.showInfo('SVG Updated')
        return;
      }

      if (e.data.type === "SVGE_READY") {
        setReady(true);
        loadSvg();
        return;
      }

      const resp = e.data as SvgeResponse;
      const resolve = pending.current.get(resp.id);
      if (resolve) { pending.current.delete(resp.id); resolve(resp); }
    };
    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, []);

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
  }, []);

  // EXAMPLES
  const loadSvg = () => {
    call("setSvgString", { svg: passage.svg });

  };
  const getSvgFromEditor  = async () => {
    const svg = await call("getSvgString");
    toast.showInfo('SVG Updated')
    onChange?.(exportSvg(svg));
  };

  const exportSvg = (svg:string)=>{
    const svgDoc = new DOMParser().parseFromString(svg, "text/xml");
    const svgEle = svgDoc.querySelector("svg");
    if (!svgEle) return svg;
    svgEle.setAttribute("width", "1920");
    svgEle.setAttribute("height", "1080");
    svgEle.setAttribute("viewBox", "0 0 1920 1080");
    return new XMLSerializer().serializeToString(svgDoc);
  }

  const autoscaleSvg = (svg: string)=>{
    const svgDoc = new DOMParser().parseFromString(svg, "text/xml");
    const svgEle = svgDoc.querySelector("svg");
    if (!svgEle) return svg;
    svgEle.removeAttribute("width")
    svgEle.removeAttribute("height");
    svgEle.setAttribute("viewBox", "0 0 1920 1080");
    return new XMLSerializer().serializeToString(svgDoc);
  }


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
              <div className="preview-container" dangerouslySetInnerHTML={{__html: svg}} />
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