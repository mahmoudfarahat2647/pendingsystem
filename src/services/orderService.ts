import { supabase as supabaseDefault } from "@/lib/supabase";
import { createOrderQueryRepository } from "./order/orderQueryRepository";
import { createOrderRepository } from "./orderRepository";

export { createOrderQueryRepository } from "./order/orderQueryRepository";
export { mapSupabaseOrder } from "./orderMapper";
export { createOrderRepository } from "./orderRepository";
export {
	handleSupabaseError,
	isMissingAttachmentColumnError,
	ServiceError,
} from "./orderServiceErrors";

export const orderService = {
	...createOrderRepository(supabaseDefault),
	...createOrderQueryRepository(supabaseDefault),
};
