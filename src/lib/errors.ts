export class OrderMappingError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OrderMappingError";
	}
}

export class FreezeReasonRequiredError extends Error {
	constructor(message = "A reason is required to freeze rows.") {
		super(message);
		this.name = "FreezeReasonRequiredError";
	}
}
