export const ORDER_STAGE_VALUES = [
	"orders",
	"main",
	"call",
	"booking",
	"archive",
	"freeze",
] as const;

export type OrderStage = (typeof ORDER_STAGE_VALUES)[number];
