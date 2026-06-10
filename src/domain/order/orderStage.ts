export const ORDER_STAGE_VALUES = [
	"orders",
	"main",
	"call",
	"booking",
	"archive",
] as const;

export type OrderStage = (typeof ORDER_STAGE_VALUES)[number];
