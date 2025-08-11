# SVG-Edit integration (embedded)

This folder hosts static assets served by Vite at runtime.

Structure expected:

- /svgedit/

1) Install/obtain SVG-Edit build.
   - Option B: Download a release and copy the `editor` directory here.
   - I did this, maybe there is a better way to have SVG editor inlined?

Notes:
- Files in `public/` are served as-is at the site root.
- If you change the location of `editor/`, update `passage-edit-svg.tsx` iframe src accordingly.
