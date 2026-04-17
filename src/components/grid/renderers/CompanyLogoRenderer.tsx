import type { ICellRendererParams } from "ag-grid-community";
import { normalizeCompanyName } from "@/lib/company";
import type { PendingRow } from "@/types";

export const CompanyLogoRenderer = (
	params: ICellRendererParams<PendingRow>,
) => {
	const company = normalizeCompanyName(params.value);
	if (!company) return null;

	if (company === "Zeekr") {
		return (
			<svg
				height="32"
				viewBox="0 0 28.75 28.11"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				role="img"
			>
				<title>Zeekr</title>
				<path
					d="M26.0757 25.7588H19.0554V17.0847L12.035 10.0663V2.33946H26.0675L26.0757 25.7588ZM2.67723 25.7588V2.33946H9.68937V11.0301L16.7097 18.0485V25.7506L2.67723 25.7588ZM28.4131 0H0.339844V28.0982H28.4131V0Z"
					fill="#4ade80"
				/>
			</svg>
		);
	}

	if (company === "Renault") {
		return (
			<svg
				height="32"
				viewBox="0 0 136.45 178.6"
				xmlns="http://www.w3.org/2000/svg"
				role="img"
			>
				<title>Renault</title>
				<polygon
					points="47.76 0 0 89.3 47.76 178.6 61.4 178.6 109.17 89.3 78.46 31.89 71.64 44.65 95.52 89.3 54.58 165.84 13.65 89.3 61.4 0 47.76 0"
					fill="#d4a017"
				/>
				<polygon
					points="75.05 0 27.29 89.3 57.99 146.71 64.81 133.95 40.93 89.3 81.87 12.76 122.81 89.3 75.05 178.6 88.69 178.6 136.45 89.3 88.69 0 75.05 0"
					fill="#d4a017"
				/>
			</svg>
		);
	}

	return <span className="text-sm font-bold">{company}</span>;
};
