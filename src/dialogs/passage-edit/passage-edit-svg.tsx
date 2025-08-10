import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Passage, Story } from '../../store/stories';


const PassageSvgEditor: React.FC<{
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
  const pending = useRef(new Map<string, (r:SvgeResponse)=>void>());

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      // TODO: tighten origin check to your editor’s origin
      if (!e.data || (e.data.type !== "SVGE_RESPONSE" && e.data.type !== "SVGE_READY" && e.data.type !== "SVG_UPDATED")) return;

      if (e.data.type === "SVG_UPDATED"){
        console.warn(e.data.result)
        return;
      }

      if (e.data.type === "SVGE_READY") {
        setReady(true);
        loadSvg();
        window.x = frameRef.current?.contentWindow;
        console.log('window.x', window.x)
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
    console.log(passage.svg)
    call("setSvgString", { svg: passage.svg });

  };
  const getSvg  = async () => {
    const svg = await call("getSvgString");
    console.log("SVG:", svg);
  };

  const setZoom = async () => {
    await call("setZoom", { zoom: 0.25 });
  };

  const setZoom2 = async () => {
    await call("setZoom", { zoom: 4 });
  };
  const exportPng = async () => {
    const pngDataUrl = await call("exportPng", { scale: 2 }); // returns data URL
    // do something with it (download, preview, upload)
    console.log("PNG:", pngDataUrl.slice(0, 64) + "...");
  };

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
              <div dangerouslySetInnerHTML={{__html: passage.svg}} />
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
            <div className="flex gap-2">
              <button disabled={!ready} onClick={loadSvg}>Load SVG</button>
              <button disabled={!ready} onClick={getSvg}>Get SVG</button>
              <button disabled={!ready} onClick={exportPng}>Export PNG</button>
              <button disabled={!ready} onClick={setZoom}>zoom</button>
              <button disabled={!ready} onClick={setZoom2}>zoom2</button>
              <button onClick={() => setIsFullscreen(false)}>Close</button>
            </div>

            <iframe
              ref={frameRef}
              title="SVG-Edit"
              src={`/svgedit/editor/index_twine.html`} // see bridge below
              style={{ width: "100%", height: "85vh", border: "1px solid #333", background: "#222" }}
              sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-popups allow-modals"
            />
          </div>
        </div>
      )
    }
  </div>)
};

export default PassageSvgEditor;