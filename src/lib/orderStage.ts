import {
	InvalidOrderStageError,
	isOrderStage,
	type OrderStage,
} from "@/domain/order/orderStage";

export const STAGE_ALIASES: Record<string, OrderStage> = {
	archive: "archive",
	booking: "booking",
	call: "call",
	"call list": "call",
	freeze: "freeze",
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
	freeze: { name: "Freeze", path: "/freeze" },
};

export function normalizeOrderStage(
	value: string | null | undefined,
): OrderStage | undefined {
	const normalized = value?.trim().toLowerCase();

	if (!normalized) {
		return undefined;
	}

	return (
		STAGE_ALIASES[normalized] ??
		(isOrderStage(normalized) ? normalized : undefined)
	);
}

/**
 * Resolves a stage value to a canonical OrderStage.
 * Checks stage aliases first, then canonical ORDER_STAGE_VALUES.
 * Throws InvalidOrderStageError if the value is missing, empty, or unrecognized.
 */
export function resolveOrderStage(
	value: string | null | undefined,
): OrderStage {
	const resolved = normalizeOrderStage(value);
	if (resolved) {
		return resolved;
	}

	throw new InvalidOrderStageError(value);
}
