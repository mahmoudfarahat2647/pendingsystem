"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/origin-select";
import type { LostSalesFilters } from "@/domain/reports/lostSalesAnalysis";

interface ReportFiltersProps {
	filters: LostSalesFilters;
	onChange: (filters: LostSalesFilters) => void;
	companies: string[];
}

export function ReportFilters({
	filters,
	onChange,
	companies,
}: ReportFiltersProps) {
	const companyValue = filters.company === null ? "all" : filters.company;

	function handleCompanyChange(value: string): void {
		onChange({ ...filters, company: value === "all" ? null : value });
	}

	function handlePeriodChange(value: string): void {
		onChange({ ...filters, period: value as LostSalesFilters["period"] });
	}

	return (
		<div className="flex items-center gap-4 flex-wrap">
			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
					Company
				</span>
				<Select value={companyValue} onValueChange={handleCompanyChange}>
					<SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-[160px]">
						<SelectValue placeholder="Select company..." />
					</SelectTrigger>
					<SelectContent className="bg-[#0c0c0e] border-white/10 text-white">
						<SelectItem value="all">All Companies</SelectItem>
						{companies.map((c) => (
							<SelectItem key={c} value={c}>
								{c}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="flex flex-col gap-1">
				<span className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
					Period
				</span>
				<Select value={filters.period} onValueChange={handlePeriodChange}>
					<SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-[160px]">
						<SelectValue placeholder="Select period..." />
					</SelectTrigger>
					<SelectContent className="bg-[#0c0c0e] border-white/10 text-white">
						<SelectItem value="all">All time</SelectItem>
						<SelectItem value="last30">Last 30 days</SelectItem>
						<SelectItem value="last90">Last 90 days</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
