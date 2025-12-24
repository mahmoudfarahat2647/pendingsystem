import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// Enable React Compiler
	experimental: {
		// reactCompiler: true,
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

export default nextConfig;
