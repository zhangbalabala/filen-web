import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { TanStackRouterVite } from "@tanstack/router-vite-plugin"
import { comlink } from "vite-plugin-comlink"
import i18nextLoader from "vite-plugin-i18next-loader"
import svgr from "vite-plugin-svgr"
import topLevelAwait from "vite-plugin-top-level-await"
import checker from "vite-plugin-checker"
import { serviceWorkerPlugin } from "@gautemo/vite-plugin-service-worker"

const now = Date.now()

export default defineConfig({
	base: "/",
	plugins: [
		nodePolyfills({
			overrides: {
				fs: "memfs"
			},
			protocolImports: true
		}),
		topLevelAwait({
			promiseExportName: "__tla",
			promiseImportName: i => `__tla_${i}`
		}),
		react({
			babel: {
				plugins: [
					[
						"babel-plugin-react-compiler",
						{
							target: "18"
						}
					]
				]
			},
			jsxImportSource: "@welldone-software/why-did-you-render"
		}),
		TanStackRouterVite(),
		comlink(),
		i18nextLoader({
			paths: ["./locales"]
		}),
		svgr(),
		serviceWorkerPlugin({
			filename: "sw.ts"
		}),
		checker({
			typescript: true
		})
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src")
		}
	},
	worker: {
		format: "es",
		plugins: () => [comlink()]
	},
	build: {
		sourcemap: true,
		rollupOptions: {
			output: {
				chunkFileNames() {
					return `[name].[hash].${now}.js`
				},
				entryFileNames() {
					return `[name].${now}.js`
				},
				assetFileNames() {
					return `assets/[name]-[hash].${now}[extname]`
				}
			}
		}
	}
})
