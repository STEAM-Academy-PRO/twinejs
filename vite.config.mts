import react from '@vitejs/plugin-react-swc';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import {defineConfig} from 'vite';
// import checker from 'vite-plugin-checker';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import {VitePWA} from 'vite-plugin-pwa';
import packageJson from './package.json';

export default defineConfig({
	base: './',
    build: {
      outDir: 'dist/web',
		target: browserslistToEsbuild(['>0.2%', 'not dead', 'not op_mini all'])
    },
    define: {
		// Make app name and version available to code.
		// https://stackoverflow.com/a/74860417/7569568
      'process.env.VITE_APP_NAME': JSON.stringify(packageJson.name),
      'process.env.VITE_APP_VERSION': JSON.stringify(packageJson.version)
    },
    plugins: [
      // checker({
		// 	eslint: {lintCommand: 'eslint src'},
		// 	overlay: {
		// 		initialIsOpen: false
		// 	},
		// 	typescript: true
      // }),
      nodePolyfills(
        // We only need a `global` injected, for CodeMirror.
        {include: [], globals: {global: true}}
      ),
      react(),
      VitePWA({
        manifest: {
          icons: [
            {
              src: './icons/pwa.png',
              sizes: '1024x1024',
              type: 'image/png'
            },
            {
              src: './icons/pwa-maskable.png',
              purpose: 'maskable',
              sizes: '1024x1024',
              type: 'image/png'
            }
          ]
        },
        registerType: 'autoUpdate',
        includeAssets: ['locales/**', 'pwa/**', 'story-formats/**'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],

          // Exclude API routes from service worker caching
          navigateFallbackDenylist: [/^\/stories\/.+/, /^\/api\/.+/],
          runtimeCaching: [
            {
              // Cache static assets
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
                }
              }
            },
            {
              // Don't cache API routes - let them go to network
              urlPattern: /^\/stories\/.*/,
              handler: 'NetworkOnly'
            },
            {
              // Don't cache API routes - let them go to network
              urlPattern: /^\/api\/.*/,
              handler: 'NetworkOnly'
            }
          ]
        }
      })
    ],
    server: {
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3010',
          changeOrigin: true,
          secure: false,
        },
        '/stories': {
          target: 'http://localhost:3010',
          changeOrigin: true,
          secure: false,
        },
      },
    }
  }
);
