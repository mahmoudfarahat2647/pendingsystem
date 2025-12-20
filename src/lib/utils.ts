import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const VIN_PREFIX_MAP: Record<string, string> = {
  "VF1RJA": "Clio V",
  "VF1RJB": "Captur II",
  "VF1RFB": "Megane IV",
  "VF1RFE": "Kadjar",
  "VF1RFA": "Talisman",
  "VF1HJB": "Duster II",
  "VF1XJA": "Arkana",
  "VF1LJA": "Logan III",
  "VF1SJA": "Sandero III",
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
 * Calculate warranty end date and remaining time
 */
export function getCalculatorValues(dateStr: string) {
  const startDate = new Date(dateStr);
  if (isNaN(startDate.getTime())) {
    return null;
  }
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 3);

  const now = new Date();
  const expired = now > endDate;

  if (expired) {
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      years: 0,
      months: 0,
      days: 0,
      expired: true,
      remainTime: "Expired",
    };
  }

  let years = endDate.getFullYear() - now.getFullYear();
  let months = endDate.getMonth() - now.getMonth();
  let days = endDate.getDate() - now.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Format as "year - month - day"
  try {
    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      years,
      months,
      days,
      expired: false,
      remainTime: `${years} Y , ${months} M , ${days} D`,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Generate a unique pastel color based on VIN hash
 */
export function getVinColor(vin: string): string {
  if (!vin) return "transparent";

  let hash = 0;
  for (let i = 0; i < vin.length; i++) {
    hash = vin.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs((hash * 137) % 360);
  return `hsl(${h}, 85%, 96%)`;
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
