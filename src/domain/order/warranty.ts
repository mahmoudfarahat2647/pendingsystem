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
