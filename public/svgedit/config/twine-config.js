/* Twine SVG-Edit configuration override
 * Served at /svgedit/config/twine-config.js
 * This is loaded by the embedded editor via ?config= URL param.
 */
(function () {
  // Wait for svgEditor global if the editor loads this early
  function setCfg() {
    if (window.svgEditor && typeof window.svgEditor.setConfig === 'function') {
      window.svgEditor.setConfig({
        // UI
        showrulers: true,
        showlayers: true,
        no_save_warning: true,
        gridSnapping: true,
        baseUnit: 'px',
        dimensions: [1920, 1080],
        // Extensions control
        // If you want to only load the ones you list, uncomment below:
        // noDefaultExtensions: true,
        // extensions: [
        //   '/svgedit/extensions/twine-asset-manager.js'
        // ]
      });
    } else {
      setTimeout(setCfg, 50);
    }
  }
  setCfg();
})();
