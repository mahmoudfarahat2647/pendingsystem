import { supabase } from "@/lib/supabase";
import type { PendingRow } from "@/types";

export type OrderStage = "orders" | "main" | "call" | "booking" | "archive";

export const orderService = {
    async getOrders(stage?: OrderStage) {
        let query = supabase.from("orders").select("*");
        if (stage) {
            query = query.eq("stage", stage);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async updateOrderStage(id: string, stage: OrderStage) {
        const { data, error } = await supabase
            .from("orders")
            .update({ stage })
            .eq("id", id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async saveOrder(order: Partial<PendingRow> & { stage: OrderStage }) {
        const { id, stage, ...rest } = order;

        // Map PendingRow fields to Supabase schema
        const supabaseOrder = {
            order_number: rest.trackingId || null,
            customer_name: rest.customerName,
            customer_phone: rest.mobile,
            vin: rest.vin,
            company: rest.company,
            stage: stage,
            metadata: rest // Store everything else in metadata for now
        };

        if (id && id.length === 36) { // Check if it's a UUID
            const { data, error } = await supabase
                .from("orders")
                .update(supabaseOrder)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from("orders")
                .insert([supabaseOrder])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    },

    async deleteOrder(id: string) {
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) throw error;
    },

    async getActivityLog() {
        const { data, error } = await supabase.from("recent_activity").select("*");
        if (error) throw error;
        return data;
    },

    mapSupabaseOrder(row: any): PendingRow {
        return {
            ...(row.metadata || {}),
            id: row.id,
            trackingId: row.order_number,
            customerName: row.customer_name,
            mobile: row.customer_phone,
            vin: row.vin,
            company: row.company,
            // stage logic is handled by the tab we are in
        } as PendingRow;
    }
};
