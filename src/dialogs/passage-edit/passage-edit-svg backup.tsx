import React from 'react';
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
  const [apiReady, setApiReady] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const apiRef = React.useRef<any>(null);

  // Mark intentionally unused props as used for linters
  void _disabled; // component currently ignores disabled state
  void _story;    // story not needed for embedded editor

  // Ensure the embed API script is loaded once
  React.useEffect(() => {
    const win = window as any;
    if (win.EmbeddedSVGEdit) return; // already loaded
    const script = document.createElement('script');
    script.src = '/svgedit/editor/embedapi.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // We don't remove the script to allow reuse across mounts
    };
  }, []);

  // Initialize the editor once iframe and script are available
  const initEditor = React.useCallback(async () => {
    const win = window as any;
    if (!iframeRef.current || !win.EmbeddedSVGEdit || apiRef.current) {
      console.warn('no iframe window re')
      return;
      
    }
    try {
      const api = new win.EmbeddedSVGEdit(iframeRef.current);
      apiRef.current = api;
      await api.ready;
      setApiReady(true);
      // Load initial SVG from passage
      if (passage?.svg) {
        await api.setSVGString(passage.svg);
      }
      // Forward changes upstream (throttled minimal)
      api.bind('changed', async () => {
        if (!onChange) return;
        try {
          const svg = await api.getSVGString();
          onChange(svg);
        } catch (e) {
          // no-op
        }
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('SVG-Edit init failed', e);
    }
  }, [onChange, passage?.svg]);

  // Re-init on mount and whenever fullscreen toggles (iframe remounts)
  React.useEffect(() => {
    // Delay a tick to ensure iframe DOM exists
    const t = setTimeout(() => initEditor(), 0);
    return () => clearTimeout(t);
  }, [initEditor, isFullscreen]);

  // If passage.svg changes externally, push into editor
  React.useEffect(() => {
    if (apiRef.current && apiReady && passage?.svg) {
      apiRef.current.setSVGString(passage.svg);
    }
  }, [apiReady, passage?.svg]);

  const iframeSrc = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('config', '/svgedit/config/twine-config.js');
    // Add custom extensions later as comma-separated list
    // params.set('extensions', '/svgedit/extensions/twine-asset-manager.js');
    return `/svgedit/editor/index.html?${params.toString()}`;
  }, []);

  const Iframe = (
    <iframe
      ref={iframeRef}
      className="svgedit-iframe"
      style={{ height: '100%' }}
      src={iframeSrc}
      title={`SVG Editor - ${passage?.name ?? passage?.id}`}
      sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-popups allow-modals"
    />
  );

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
            height: '100px',
            backgroundColor: 'black',
            zIndex: 1000,
            padding: 8,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 1001 }}>
            <button onClick={() => setIsFullscreen(false)}>Close</button>
          </div>
          <div className="passage-edit-svg" style={{ height: '100%', paddingTop: '2rem' }}>
            {Iframe}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassageSvgEditor;