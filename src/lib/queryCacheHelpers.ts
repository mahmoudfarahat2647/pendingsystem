import { QueryClient } from "@tanstack/react-query";
import { getOrdersQueryKey, ORDER_STAGES } from "@/lib/queryClient";
import type { OrderStage } from "@/services/orderService";
import type { PendingRow } from "@/types";

export type OrdersCacheSnapshot = Partial<Record<OrderStage, PendingRow[] | undefined>>;

export interface BulkStageContext {
    previousOrdersCache: OrdersCacheSnapshot;
    touchedStages: OrderStage[];
    destinationStage: OrderStage;
}

export interface DeleteContext {
    previousOrdersCache: OrdersCacheSnapshot;
    touchedStages: OrderStage[];
}

export const getErrorMessage = (error: unknown): string => {
    let message = "";
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === "object" && error) {
        const err = error as Record<string, unknown>;
        if (typeof err.message === "string") message = err.message;
        else if (typeof err.hint === "string") message = err.hint;
        else if (typeof err.details === "string") message = err.details;
    }

    if (!message) {
        message = String(error);
    }

    // Truncate to avoid leaking huge payloads into toasts
    return message.length > 200 ? message.slice(0, 197) + "..." : message;
};

export const getMovedRowsById = (
    rows: PendingRow[] | undefined,
    idSet: Set<string>,
    destinationStage: OrderStage,
    collector: Map<string, PendingRow>,
) => {
    if (!rows) {
        return rows;
    }

    return rows.filter((row) => {
        if (!idSet.has(row.id)) {
            return true;
        }

        collector.set(row.id, { ...row, stage: destinationStage });
        return false;
    });
};

export const restoreOrdersCache = (queryClient: QueryClient, cacheSnapshot: OrdersCacheSnapshot) => {
    for (const stage of ORDER_STAGES) {
        if (cacheSnapshot[stage] !== undefined) {
            queryClient.setQueryData(getOrdersQueryKey(stage), cacheSnapshot[stage]);
        }
    }
};
