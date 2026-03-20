import type { OrderStage } from "@/services/orderService";

const STAGE_ALIASES: Record<string, OrderStage> = {
	archive: "archive",
	booking: "booking",
	call: "call",
	"call list": "call",
	main: "main",
	"main sheet": "main",
	orders: "orders",
};

export function normalizeOrderStage(
	value: string | null | undefined,
): OrderStage | undefined {
	const normalized = value?.trim().toLowerCase();

	if (!normalized) {
		return undefined;
	}

	return STAGE_ALIASES[normalized];
}
