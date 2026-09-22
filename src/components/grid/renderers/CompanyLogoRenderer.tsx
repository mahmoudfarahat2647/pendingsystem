import type { ICellRendererParams } from "ag-grid-community";
import { CompanyLogo } from "@/components/shared/CompanyLogo";
import { normalizeCompanyName } from "@/domain/company/company";
import type { PendingRow } from "@/types";

export const CompanyLogoRenderer = (
	params: ICellRendererParams<PendingRow>,
) => {
	const company = normalizeCompanyName(params.value);
	if (!company) return null;

	if (company === "Zeekr" || company === "Renault") {
		return <CompanyLogo company={company} height={32} />;
	}

	return <span className="text-sm font-bold">{company}</span>;
};
