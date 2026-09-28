/**
 * Calculate the end date of a warranty (3 years from start)
 */
export const calculateEndWarranty = (startDate: string): string => {
	if (!startDate) return "";
	const date = new Date(startDate);
	if (Number.isNaN(date.getTime())) return ""; // Handle invalid date
	date.setFullYear(date.getFullYear() + 3);
	return date.toISOString().split("T")[0];
};

/**
 * Calculate remaining time in "Y y - M m - D d" format
 * Returns "Expired" if past end date
 */
export const calculateRemainingTime = (endDate: string): string => {
	if (!endDate) return "";
	const end = new Date(endDate);
	const now = new Date();
	const diffTime = end.getTime() - now.getTime();

	if (diffTime < 0) return "Expired";

	const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	const years = Math.floor(totalDays / 365);
	const months = Math.floor((totalDays % 365) / 30);
	const days = (totalDays % 365) % 30;

	return `${years} y - ${months} m - ${days} d`;
};

export function isWarrantyExpired(endWarranty: string): boolean {
	const parts = endWarranty.split("-").map(Number);
	if (parts.length !== 3 || parts.some(Number.isNaN)) return false;
	const [y, m, d] = parts;
	const endDate = new Date(y, m - 1, d);
	if (Number.isNaN(endDate.getTime())) return false;
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	return endDate < todayStart;
}

export function getEffectiveEndWarranty(row: {
	endWarranty?: string | null;
	startWarranty?: string | null;
}): string {
	if (row.endWarranty) return row.endWarranty;
	if (row.startWarranty) return calculateEndWarranty(row.startWarranty);
	return "";
}

export const WARRANTY_REPAIR_SYSTEM = "ضمان";

/**
 * Returns true if a row is a warranty row (`repairSystem === "ضمان"`)
 * and its effective warranty end date is past.
 */
export function isExpiredWarrantyRow(row: {
	repairSystem?: string | null;
	endWarranty?: string | null;
	startWarranty?: string | null;
}): boolean {
	if (row.repairSystem !== WARRANTY_REPAIR_SYSTEM) return false;
	const effectiveEnd = getEffectiveEndWarranty(row);
	return Boolean(effectiveEnd && isWarrantyExpired(effectiveEnd));
}

/**
 * Returns true if a row in the Booking stage is exempt from the warranty
 * auto-archive sweep because it was rebooked from Archive.
 */
export function isProtectedRebook(row: {
	stage?: string | null;
	rebookedFromArchive?: boolean | null;
}): boolean {
	return row.stage === "booking" && row.rebookedFromArchive === true;
}
