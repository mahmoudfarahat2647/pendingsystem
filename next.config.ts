import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	webpack: (config, { isServer, webpack: wp }) => {
		if (!isServer) {
			// pptxgenjs uses node: URI scheme (e.g. "node:fs") which webpack cannot
			// resolve for browser bundles. NormalModuleReplacementPlugin strips the
			// prefix first, then fallback stubs the built-ins to empty modules.
			config.plugins?.push(
				new wp.NormalModuleReplacementPlugin(
					/^node:/,
					(resource: { request: string }) => {
						resource.request = resource.request.replace(/^node:/, "");
					},
				),
			);
			config.resolve = {
				...config.resolve,
				fallback: {
					...(config.resolve?.fallback as Record<string, unknown>),
					fs: false,
					path: false,
					os: false,
					stream: false,
					zlib: false,
					buffer: false,
					util: false,
					events: false,
				},
			};
		}
		return config;
	},
	// Enable React Compiler
	experimental: {
		// reactCompiler: true,
		inlineCss: process.env.NEXT_INLINE_CSS === "true",
		optimizePackageImports: [
			"lucide-react",
			"recharts",
			"date-fns",
			"@radix-ui/react-dialog",
			"@radix-ui/react-dropdown-menu",
			"@radix-ui/react-slot",
			"@radix-ui/react-tabs",
			"@radix-ui/react-tooltip",
			"@radix-ui/react-select",
			"@radix-ui/react-checkbox",
			"@radix-ui/react-label",
			"ag-grid-react",
			"ag-grid-community",
		],
	},
	images: {
		formats: ["image/avif", "image/webp"],
	},
	// Optimize imports for better tree-shaking
	modularizeImports: {
		"lucide-react": {
			transform: "lucide-react/dist/esm/icons/{{lowerCase kebabCase member}}",
			skipDefaultConversion: true,
		},
	},
	// Standalone output for smaller container sizes if needed
	output: "standalone",
};

export default withSentryConfig(nextConfig, {
	org: "koko-sz",
	project: "pendingsystem",
	authToken: process.env.SENTRY_AUTH_TOKEN,
	silent: false,
});
