"use client";

import { BarChart3 } from "lucide-react";
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
		<div className="space-y-6 pb-8 max-w-[1400px] mx-auto">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-renault-yellow rounded-xl flex items-center justify-center">
						<BarChart3 className="w-5 h-5 text-black" />
					</div>
					<div>
						<h1 className="text-xl font-bold text-white">Reports</h1>
						<p className="text-xs text-gray-400">
							Lost Sales Analysis — Main Sheet Demand
						</p>
					</div>
				</div>
				<ReportExportMenu
					report={report}
					filters={filters}
					disabled={isLoading}
				/>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
				<span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
					Filters
				</span>
				<ReportFilters
					filters={filters}
					onChange={setFilters}
					companies={availableCompanies}
				/>
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
