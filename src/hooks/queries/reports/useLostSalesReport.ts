import { useMemo } from "react";

import {
	computeLostSalesReport,
	type LostSalesFilters,
	type LostSalesReport,
} from "@/domain/reports/lostSalesAnalysis";
import { useOrdersQuery } from "@/hooks/queries/useOrdersQuery";

const EMPTY_REPORT: LostSalesReport = {
	kpis: {
		totalOrders: 0,
		distinctParts: 0,
		totalQuantity: 0,
		distinctModels: 0,
	},
	topParts: [],
	modelDemand: [],
};

export function useLostSalesReport(filters: LostSalesFilters): {
	report: LostSalesReport;
	availableCompanies: string[];
	isLoading: boolean;
	isError: boolean;
} {
	const { data = [], isLoading, isError } = useOrdersQuery("main");

	const availableCompanies = useMemo(() => {
		const seen = new Set<string>();
		for (const row of data) {
			const company = row.company;
			if (company && company !== "") seen.add(company);
		}
		return Array.from(seen).sort();
	}, [data]);

	const report = useMemo(() => {
		if (isLoading) return EMPTY_REPORT;
		return computeLostSalesReport(data, filters);
		// Decompose filters to avoid recomputing when the object reference changes but values are stable.
		// If LostSalesFilters gains new fields, add them here.
	}, [data, filters.company, filters.period, isLoading]);

	return { report, availableCompanies, isLoading, isError };
}
