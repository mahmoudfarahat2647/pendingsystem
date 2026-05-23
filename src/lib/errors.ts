export class OrderMappingError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OrderMappingError";
	}
}
