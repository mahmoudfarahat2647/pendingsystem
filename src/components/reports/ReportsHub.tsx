"use client";

import { useState } from "react";
import { LostSalesReportView } from "@/components/reports/LostSalesReportView";
import { ReportExportMenu } from "@/components/reports/ReportExportMenu";
import { ReportFilters } from "@/components/reports/ReportFilters";
import type { LostSalesFilters } from "@/domain/reports/lostSalesAnalysis";
import { useLostSalesReport } from "@/hooks/queries/reports/useLostSalesReport";

const defaultFilters: LostSalesFilters = { company: null, period: "all" };

export function ReportsHub() {
	const [filters, setFilters] = useState<LostSalesFilters>(defaultFilters);
	const { report, availableCompanies, isLoading, isError } =
		useLostSalesReport(filters);

	return (
		<div className="space-y-3 pb-4 max-w-[1400px] mx-auto">
			{/* Filters */}
			<div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
				<span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
					Filters
				</span>
				<ReportFilters
					filters={filters}
					onChange={setFilters}
					companies={availableCompanies}
				/>
				<div className="ml-auto">
					<ReportExportMenu
						report={report}
						filters={filters}
						disabled={isLoading}
					/>
				</div>
			</div>

			{/* Error state */}
			{isError && (
				<div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
					Failed to load report data. Please try again.
				</div>
			)}

			{/* Report */}
			<LostSalesReportView report={report} isLoading={isLoading} />
		</div>
	);
}
