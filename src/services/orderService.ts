import { supabase as supabaseDefault } from "@/lib/supabase";
import { createOrderRepository } from "./orderRepository";

export { mapSupabaseOrder } from "./orderMapper";
export type OrderStage = "orders" | "main" | "call" | "booking" | "archive";
export { createOrderRepository } from "./orderRepository";
export {
	handleSupabaseError,
	isMissingAttachmentColumnError,
	ServiceError,
} from "./orderServiceErrors";

/** @deprecated use createOrderRepository */
export const createOrderService = createOrderRepository;

export const orderService = createOrderRepository(supabaseDefault);
