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

export function detectModelFromVin(vin: string): string | null {
	if (!vin || vin.length < 6) return null;
	const prefix = vin.substring(0, 6).toUpperCase();
	return VIN_PREFIX_MAP[prefix] || null;
}
