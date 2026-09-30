import { useId } from "react";

interface PreviewPalette {
	page: string;
	sidebar: string;
	sidebarItem: string;
	sidebarActive: string;
	content: string;
	line: string;
	lineStrong: string;
	block: string;
	dot: string;
}

const PALETTES: Record<"dark" | "white", PreviewPalette> = {
	dark: {
		page: "#0a0a0b",
		sidebar: "#000000",
		sidebarItem: "#262626",
		sidebarActive: "#FFCC00",
		content: "#141416",
		line: "#525252",
		lineStrong: "#A3A3A3",
		block: "#262626",
		dot: "#404040",
	},
	white: {
		page: "#ffffff",
		sidebar: "#1f2328",
		sidebarItem: "#3a3f46",
		sidebarActive: "#FFCC00",
		content: "#f5f5f6",
		line: "#d4d4d4",
		lineStrong: "#737373",
		block: "#e5e5e5",
		dot: "#d4d4d4",
	},
};

/**
 * Miniature app mock-up (sidebar + content) used by the Settings theme cards.
 * Ids are per-instance so several previews can render on one page.
 */
const ThemePreview = ({ palette }: { palette: PreviewPalette }) => {
	const uid = useId().replace(/:/g, "");
	const clipId = `theme-preview-clip-${uid}`;
	const fadeId = `theme-preview-fade-${uid}`;

	return (
		<svg
			width="177"
			height="140"
			viewBox="0 0 177 140"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			className="block h-auto w-full"
		>
			<g clipPath={`url(#${clipId})`}>
				<rect width="177" height="162" rx="3" fill={palette.page} />
				<rect x="0" y="0" width="44" height="162" fill={palette.sidebar} />
				<rect x="5" y="6" width="8" height="8" rx="2" fill="#FFCC00" />
				<rect
					x="16"
					y="8"
					width="22"
					height="4"
					rx="1"
					fill={palette.sidebarItem}
				/>
				<rect
					x="5"
					y="22"
					width="34"
					height="7"
					rx="3"
					fill={palette.sidebarActive}
					fillOpacity="0.9"
				/>
				{[34, 44, 54, 64, 74].map((y) => (
					<rect
						key={y}
						x="5"
						y={y}
						width="34"
						height="6"
						rx="3"
						fill={palette.sidebarItem}
					/>
				))}
				<rect
					x="52"
					y="6"
					width="80"
					height="8"
					rx="4"
					fill={palette.content}
				/>
				<circle cx="165" cy="10" r="4" fill={palette.dot} />
				<rect
					x="52"
					y="22"
					width="117"
					height="38"
					rx="4"
					fill={palette.content}
				/>
				<rect
					x="58"
					y="30"
					width="30"
					height="3"
					rx="1.5"
					fill={palette.lineStrong}
				/>
				<rect x="58" y="37" width="48" height="2" rx="1" fill={palette.line} />
				<rect x="58" y="42" width="38" height="2" rx="1" fill={palette.line} />
				{[52, 92, 132].map((x) => (
					<rect
						key={x}
						x={x}
						y="66"
						width="37"
						height="22"
						rx="3"
						fill={palette.block}
					/>
				))}
				<rect
					x="52"
					y="94"
					width="117"
					height="46"
					rx="4"
					fill={palette.content}
				/>
				{[100, 108, 116, 124].map((y) => (
					<rect
						key={y}
						x="58"
						y={y}
						width="105"
						height="3"
						rx="1.5"
						fill={palette.line}
					/>
				))}
				<rect
					width="177"
					height="140"
					fill={`url(#${fadeId})`}
					fillOpacity="0.12"
				/>
			</g>
			<defs>
				<linearGradient
					id={fadeId}
					x1="88.5"
					y1="0"
					x2="88.5"
					y2="140"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.57" stopOpacity="0" />
					<stop offset="1" />
				</linearGradient>
				<clipPath id={clipId}>
					<rect width="177" height="140" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export const DarkThemePreview = () => <ThemePreview palette={PALETTES.dark} />;
export const WhiteThemePreview = () => (
	<ThemePreview palette={PALETTES.white} />
);
