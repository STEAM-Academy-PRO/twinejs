// svgedit-bridge.js
/* eslint-disable */
(function () {
    // Wait for SVG-Edit to initialize
    function onReady(fn) {
      if (window.svgEditor && window.svgEditor.ready) {
        window.svgEditor.ready(fn);
      } else {
        const i = setInterval(() => {
          if (window.svgEditor && window.svgEditor.ready) { clearInterval(i); window.svgEditor.ready(fn); }
        }, 50);
      }
    }

    function ok(id, result)  { parent.postMessage({ type: "SVGE_RESPONSE", id, ok: true,  result }, "*"); }
    function send(id, result)  { parent.postMessage({ type: "SVG_UPDATED", id, ok: true,  result }, "*"); }
    function err(id, error)  { parent.postMessage({ type: "SVGE_RESPONSE", id, ok: false, error: String(error) }, "*"); }

    onReady(() => {
      const canvas = window.svgEditor.svgCanvas;

      canvas.bind("changed", async (_win, elems) => {
        // console.log('changed!')
        // send("changed", { ids: elems.map(e => e?.id).filter(Boolean) });
        send("SVG_UPDATED", await canvas.getSvgString());
      });

      parent.postMessage({ type: "SVGE_READY" }, "*");

      console.log('loaded')

      window.addEventListener("message", async (e) => {
        const msg = e.data || {};
        if (msg.type !== "SVGE_REQUEST") return;
        const { id, method, params } = msg;

        try {
          switch (method) {
            case "setSvgString": {
              const { svg } = params || {};
              await window.svgEditor.loadFromString(svg);
              return ok(id, true);
            }
            case "getSvgString": {
              const svg = await canvas.getSvgString();
              return ok(id, svg);
            }
            case "setMode": {
              canvas.setMode(params?.mode || "select");
              return ok(id, true);
            }
            case "setZoom": {
                canvas.setZoom(params.zoom);
              return ok(id, true);
            }
            case "insertSvg": {
              canvas.addSVGElementsFromJson({
                element: "image",
                attr: { x: 10, y: 10, width: 300, height: 600, href: params.url }
              });
              return ok(id, true);
            }
            case "addRect": {
              const r = canvas.addSVGElementsFromJson({
                element: "rect",
                attr: { x: 10, y: 10, width: 100, height: 60, fill: "#f90" }
              });
              return ok(id, r?.elem?.id || true);
            }
            case "exportPng": {
              const scale = params?.scale ?? 1;
              const dataUrl = await window.svgEditor.rasterExport("PNG", null, scale);
              return ok(id, dataUrl);
            }
            default:
              throw new Error(`Unknown method: ${method}`);
          }
        } catch (e2) {
          err(id, e2);
        }
      });
    });
    console.warn('SVG editor client script loaded')
  })();
