import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const VIN_PREFIX_MAP: Record<string, string> = {
	VF1RJA: "Clio V",
	VF1RJB: "Captur II",
	VF1RFB: "Megane IV",
	VF1RFE: "Kadjar",
	VF1RFA: "Talisman",
	VF1HJB: "Duster II",
	VF1XJA: "Arkana",
	VF1LJA: "Logan III",
	VF1SJA: "Sandero III",
};

/**
 * Detect vehicle model from VIN prefix
 */
export function detectModelFromVin(vin: string): string | null {
	if (!vin || vin.length < 6) return null;
	const prefix = vin.substring(0, 6).toUpperCase();
	return VIN_PREFIX_MAP[prefix] || null;
}

/**
 * Generate a unique consistent badge color based on VIN hash
 * Uses a curated palette of visually distinct dark colors for white text
 */
export interface VinBadgeStyle {
	bg: string;
	text: string;
	border: string;
}

/**
 * Generate a consistent Tonal Badge style based on VIN hash
 * Returns a matched set of background, text, and border colors
 * optimized for dark mode UI (Linear/GitHub style)
 */
export function getVinColor(vin: string): VinBadgeStyle {
	if (!vin)
		return {
			bg: "rgba(107, 114, 128, 0.15)",
			text: "#9ca3af",
			border: "rgba(107, 114, 128, 0.2)",
		};

	// Curated "Tonal" palette: Subtle transparent bg + Vibrant text
	const palette: VinBadgeStyle[] = [
		{
			bg: "rgba(239, 68, 68, 0.15)",
			text: "#f87171",
			border: "rgba(239, 68, 68, 0.2)",
		}, // Red
		{
			bg: "rgba(249, 115, 22, 0.15)",
			text: "#fb923c",
			border: "rgba(249, 115, 22, 0.2)",
		}, // Orange
		{
			bg: "rgba(245, 158, 11, 0.15)",
			text: "#fbbf24",
			border: "rgba(245, 158, 11, 0.2)",
		}, // Amber
		{
			bg: "rgba(132, 204, 22, 0.15)",
			text: "#a3e635",
			border: "rgba(132, 204, 22, 0.2)",
		}, // Lime
		{
			bg: "rgba(34, 197, 94, 0.15)",
			text: "#4ade80",
			border: "rgba(34, 197, 94, 0.2)",
		}, // Green
		{
			bg: "rgba(16, 185, 129, 0.15)",
			text: "#34d399",
			border: "rgba(16, 185, 129, 0.2)",
		}, // Emerald
		{
			bg: "rgba(20, 184, 166, 0.15)",
			text: "#2dd4bf",
			border: "rgba(20, 184, 166, 0.2)",
		}, // Teal
		{
			bg: "rgba(6, 182, 212, 0.15)",
			text: "#22d3ee",
			border: "rgba(6, 182, 212, 0.2)",
		}, // Cyan
		{
			bg: "rgba(14, 165, 233, 0.15)",
			text: "#38bdf8",
			border: "rgba(14, 165, 233, 0.2)",
		}, // Sky
		{
			bg: "rgba(59, 130, 246, 0.15)",
			text: "#60a5fa",
			border: "rgba(59, 130, 246, 0.2)",
		}, // Blue
		{
			bg: "rgba(99, 102, 241, 0.15)",
			text: "#818cf8",
			border: "rgba(99, 102, 241, 0.2)",
		}, // Indigo
		{
			bg: "rgba(139, 92, 246, 0.15)",
			text: "#a78bfa",
			border: "rgba(139, 92, 246, 0.2)",
		}, // Violet
		{
			bg: "rgba(168, 85, 247, 0.15)",
			text: "#c084fc",
			border: "rgba(168, 85, 247, 0.2)",
		}, // Purple
		{
			bg: "rgba(217, 70, 239, 0.15)",
			text: "#e879f9",
			border: "rgba(217, 70, 239, 0.2)",
		}, // Fuchsia
		{
			bg: "rgba(236, 72, 153, 0.15)",
			text: "#f472b6",
			border: "rgba(236, 72, 153, 0.2)",
		}, // Pink
		{
			bg: "rgba(244, 63, 94, 0.15)",
			text: "#fb7185",
			border: "rgba(244, 63, 94, 0.2)",
		}, // Rose
	];

	let hash = 0;
	for (let i = 0; i < vin.length; i++) {
		hash = vin.charCodeAt(i) + ((hash << 5) - hash);
	}

	const index = Math.abs(hash % palette.length);
	return palette[index];
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	return date.toLocaleDateString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}
