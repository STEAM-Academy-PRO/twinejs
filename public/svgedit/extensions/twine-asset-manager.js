/* Twine Asset Manager extension (placeholder)
 * Served at /svgedit/extensions/twine-asset-manager.js
 */
(function () {
  function init() {
    if (!window.svgEditor || !window.svgEditor.addExtension) {
      return setTimeout(init, 50);
    }
    window.svgEditor.addExtension('twine-asset-manager', function (api) {
      const name = 'Twine Asset Manager';
      return {
        name,
        async callback() {
          // This is a placeholder. You can add UI and insert an <image> later.
          // Example insertion:
          // api.canvas.addSvgElementFromJson({
          //   element: 'image',
          //   attr: { x: 0, y: 0, width: 200, height: 200, href: 'data:image/png;base64,...' }
          // });
        }
      };
    });
  }
  init();
})();
