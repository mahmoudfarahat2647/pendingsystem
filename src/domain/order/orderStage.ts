export const ORDER_STAGE_VALUES = [
	"orders",
	"main",
	"call",
	"booking",
	"archive",
	"freeze",
] as const;

export type OrderStage = (typeof ORDER_STAGE_VALUES)[number];

export class InvalidOrderStageError extends Error {
	constructor(stage: unknown) {
		super(
			`Invalid or unrecognized order stage: ${
				typeof stage === "string" ? `"${stage}"` : String(stage)
			}`,
		);
		this.name = "InvalidOrderStageError";
	}
}

export function isOrderStage(value: unknown): value is OrderStage {
	return (
		typeof value === "string" &&
		ORDER_STAGE_VALUES.some((stage) => stage === value)
	);
}
