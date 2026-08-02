import type { OrderStage } from "@/domain/order/orderStage";

const STAGE_ALIASES: Record<string, OrderStage> = {
	archive: "archive",
	booking: "booking",
	call: "call",
	"call list": "call",
	main: "main",
	"main sheet": "main",
	orders: "orders",
};

/** Display name and app route for each operational stage. */
export const ORDER_STAGE_TAB_INFO: Record<
	OrderStage,
	{ name: string; path: string }
> = {
	orders: { name: "Orders", path: "/orders" },
	main: { name: "Main Sheet", path: "/main-sheet" },
	call: { name: "Call List", path: "/call-list" },
	booking: { name: "Booking", path: "/booking" },
	archive: { name: "Archive", path: "/archive" },
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
