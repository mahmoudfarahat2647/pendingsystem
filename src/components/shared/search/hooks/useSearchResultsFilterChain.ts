"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	SEARCH_SOURCES,
	type SearchSource,
} from "@/components/shared/search/searchSources";
import { ALLOWED_COMPANIES } from "@/domain/order/constants";
import {
	filterRowsByValues,
	getCompanyValue,
	getModelValue,
	getRowValueFilterOptions,
} from "@/lib/rowValueFilter";
import type { PendingRow } from "@/types";

// Source -> company -> model filter chain for the Global Search results grid.
// Each stage narrows the next stage's options via render-time intersection
// (not an effect) so a selection can never itself produce an empty grid, and
// a search-term change can never flash a stale filter against new results.
export const useSearchResultsFilterChain = (searchResults: PendingRow[]) => {
	// Distinct sourceType values present in searchResults (pre-filter)
	const sourceOptions = useMemo<SearchSource[]>(() => {
		const available = new Set<string>();
		for (const row of searchResults) {
			if (row.sourceType) {
				available.add(row.sourceType);
			}
		}
		return SEARCH_SOURCES.map((s) => s.source).filter((source) =>
			available.has(source),
		);
	}, [searchResults]);

	const [activeSourceFilter, setActiveSourceFilter] =
		useState<SearchSource | null>(null);

	// Intersect during render (not in an effect): a post-render prune would let
	// one frame through with new searchResults and a stale filter, flashing an
	// empty grid when the search term changes while a source filter is active.
	const sourceOptionSet = useMemo(
		() => new Set<SearchSource>(sourceOptions),
		[sourceOptions],
	);
	const effectiveSourceFilter = useMemo(
		() =>
			activeSourceFilter && sourceOptionSet.has(activeSourceFilter)
				? activeSourceFilter
				: null,
		[activeSourceFilter, sourceOptionSet],
	);

	const sourceFilteredResults = useMemo(() => {
		if (!effectiveSourceFilter) return searchResults;
		return searchResults.filter(
			(row) => row.sourceType === effectiveSourceFilter,
		);
	}, [searchResults, effectiveSourceFilter]);

	// Tidy the active source filter once its source disappears from search results.
	// The render-time intersection above keeps `sourceFilteredResults` correct in the meantime.
	useEffect(() => {
		setActiveSourceFilter((current) => {
			if (current && !sourceOptionSet.has(current)) {
				return null;
			}
			return current;
		});
	}, [sourceOptionSet]);

	const handleSourceFilterChange = useCallback(
		(source: SearchSource | null) => {
			setActiveSourceFilter((current) => {
				if (source === null || current === source) {
					return null;
				}
				return source;
			});
		},
		[],
	);

	// Company filter (Global Search toolbar). Buttons are always rendered from the
	// fixed ALLOWED_COMPANIES list; availability is derived from the source-filtered
	// results so a company with no matching row renders disabled, mirroring how
	// `sourceOptions` gates the stage dots. Multi-select: selecting every entry in
	// ALLOWED_COMPANIES is treated as no filter (see `isEveryCompanySelected` below),
	// so rows with a blank/unrecognized company aren't hidden just because both
	// buttons happen to be on.
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

	const availableCompanies = useMemo<string[]>(() => {
		const available = new Set<string>();
		for (const row of sourceFilteredResults) {
			const company = getCompanyValue(row);
			if (typeof company === "string" && company) {
				available.add(company);
			}
		}
		return ALLOWED_COMPANIES.filter((company) => available.has(company));
	}, [sourceFilteredResults]);

	// Intersect during render (not in an effect): a post-render prune would let one
	// frame through with the new searchResults and the old selection, flashing an
	// empty grid when the search term changes while a company button is still active.
	const availableCompanySet = useMemo(
		() => new Set(availableCompanies),
		[availableCompanies],
	);
	const effectiveSelectedCompanies = useMemo(
		() => selectedCompanies.filter((value) => availableCompanySet.has(value)),
		[selectedCompanies, availableCompanySet],
	);

	// Compared against the fixed ALLOWED_COMPANIES list (not `availableCompanies`):
	// when only one company has any matching rows, selecting that single button
	// must still filter down to it, not fall through to "no filter".
	const isEveryCompanySelected =
		effectiveSelectedCompanies.length === ALLOWED_COMPANIES.length;

	const companyFilteredResults = useMemo(() => {
		if (isEveryCompanySelected) return sourceFilteredResults;
		return filterRowsByValues(
			sourceFilteredResults,
			effectiveSelectedCompanies,
			getCompanyValue,
		);
	}, [
		sourceFilteredResults,
		effectiveSelectedCompanies,
		isEveryCompanySelected,
	]);

	// Tidy the active company selection once a selected company disappears from
	// the results. The render-time intersection above keeps `companyFilteredResults`
	// correct in the meantime.
	useEffect(() => {
		setSelectedCompanies((current) => {
			const next = current.filter((value) => availableCompanySet.has(value));
			return next.length === current.length ? current : next;
		});
	}, [availableCompanySet]);

	const handleCompanyFilterChange = useCallback((company: string) => {
		setSelectedCompanies((current) =>
			current.includes(company)
				? current.filter((value) => value !== company)
				: [...current, company],
		);
	}, []);

	const handleCompanyFilterClear = useCallback(() => {
		setSelectedCompanies([]);
	}, []);

	// Car model filter (Global Search toolbar). Options are derived from the
	// company-filtered results so model chips always match >=1 visible row.
	const [selectedModels, setSelectedModels] = useState<string[]>([]);

	const modelOptions = useMemo(
		() => getRowValueFilterOptions(companyFilteredResults, getModelValue),
		[companyFilteredResults],
	);

	// Intersect during render (not in an effect): a post-render prune would let one
	// frame through with the new searchResults and the old selection, flashing an
	// empty grid when the search term changes while a model chip is still selected.
	const modelOptionValues = useMemo(
		() => new Set(modelOptions.map((option) => option.value)),
		[modelOptions],
	);
	const effectiveSelectedModels = useMemo(
		() => selectedModels.filter((value) => modelOptionValues.has(value)),
		[selectedModels, modelOptionValues],
	);

	const filteredResults = useMemo(
		() =>
			filterRowsByValues(
				companyFilteredResults,
				effectiveSelectedModels,
				getModelValue,
			),
		[companyFilteredResults, effectiveSelectedModels],
	);

	// Tidy the rendered chips once a selected model disappears from the results
	// (e.g. the search term changed). The render-time intersection above is what
	// keeps `filteredResults` correct in the meantime.
	useEffect(() => {
		setSelectedModels((current) => {
			const next = current.filter((value) => modelOptionValues.has(value));
			return next.length === current.length ? current : next;
		});
	}, [modelOptionValues]);

	return {
		sourceOptions,
		activeSourceFilter,
		handleSourceFilterChange,
		availableCompanies,
		selectedCompanies,
		handleCompanyFilterChange,
		handleCompanyFilterClear,
		modelOptions,
		selectedModels,
		setSelectedModels,
		filteredResults,
	};
};
