import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColDef, GridApi } from "ag-grid-community";
import { useCallback, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchResultsGrid } from "@/components/shared/search/SearchResultsGrid";
import type { PendingRow } from "@/types";

// Renders the REAL AG Grid (not mocked) to guard issue #297. An inline
// `defaultColDef` was a new object on every parent render, so AG Grid re-applied
// column defaults -> onModelUpdated -> parent setState -> re-render, in a loop.
// With a filter popup open the loop never settled: the popup input was rebuilt
// mid-typing and API filter/selection calls never resolved.

const makeRow = (id: string, sabNumber: string, quantity: number) =>
	({ id, sabNumber, quantity }) as unknown as PendingRow;

const ROWS: PendingRow[] = [
	makeRow("r1", "1630000986", 1),
	makeRow("r2", "1630001803", 2),
	makeRow("r3", "1130396319", 3),
];

const COLUMNS: ColDef<PendingRow>[] = [
	{ headerName: "SAB NO.", field: "sabNumber" },
	{ headerName: "QTY", field: "quantity", filter: "agNumberColumnFilter" },
];

interface HarnessProps {
	rowData?: PendingRow[];
	initialShowFilters?: boolean;
	onApi?: (api: GridApi<PendingRow>) => void;
}

let modelUpdates = 0;

// Mirrors useSearchResultsState: every model update deselects rows hidden by the
// filter and pushes a NEW selected-rows array into parent state (re-render).
const Harness = ({
	rowData = ROWS,
	initialShowFilters = true,
	onApi,
}: HarnessProps) => {
	const [showFilters, setShowFilters] = useState(initialShowFilters);
	const [selected, setSelected] = useState<PendingRow[]>([]);
	const [renders, setRenders] = useState(0);

	const handleDisplayedRowsChanged = useCallback((api: GridApi<PendingRow>) => {
		modelUpdates += 1;
		const displayed = new Set<string>();
		api.forEachNodeAfterFilter((node) => {
			if (node.data?.id) displayed.add(node.data.id);
		});
		api.forEachNode((node) => {
			if (node.data && !displayed.has(node.data.id) && node.isSelected()) {
				node.setSelected(false);
			}
		});
		setSelected(api.getSelectedRows());
	}, []);

	return (
		<div>
			<button type="button" onClick={() => setShowFilters((v) => !v)}>
				toggle-filters
			</button>
			<button type="button" onClick={() => setRenders((n) => n + 1)}>
				rerender
			</button>
			<span data-testid="selected-count">{selected.length}</span>
			<span data-testid="renders">{renders}</span>
			<div style={{ width: 1200, height: 600 }}>
				<SearchResultsGrid
					rowData={rowData}
					columnDefs={COLUMNS}
					onCellValueChanged={() => {}}
					onSelectionChanged={() => {}}
					onGridApiReady={onApi}
					onDisplayedRowsChanged={handleDisplayedRowsChanged}
					showFilters={showFilters}
				/>
			</div>
		</div>
	);
};

const displayedIds = (api: GridApi<PendingRow>) => {
	const ids: string[] = [];
	api.forEachNodeAfterFilter((node) => {
		if (node.data?.id) ids.push(node.data.id);
	});
	return ids;
};

const selectById = (api: GridApi<PendingRow>, ids: string[]) => {
	api.forEachNode((node) => {
		if (node.data && ids.includes(node.data.id)) node.setSelected(true);
	});
};

// AG Grid's number floating filter renders a second (hidden) input; the first is the visible one.
const getQtyInput = () =>
	screen.getAllByLabelText("QTY Filter Input")[0] as HTMLInputElement;

const setup = async (props: HarnessProps = {}) => {
	modelUpdates = 0;
	let api: GridApi<PendingRow> | null = null;
	const user = userEvent.setup();
	render(
		<Harness
			{...props}
			onApi={(a) => {
				api = a;
			}}
		/>,
	);
	await waitFor(() => expect(api).not.toBeNull());
	const sabInput = await screen.findByLabelText("SAB NO. Filter Input");
	return {
		user,
		getApi: () => api as unknown as GridApi<PendingRow>,
		sabInput,
	};
};

describe("SearchResultsGrid column filters (issue #297, real AG Grid)", () => {
	it("keeps focus and typed text in a floating filter across parent re-renders", async () => {
		const { user, getApi, sabInput } = await setup();

		await user.click(sabInput);
		for (const char of "0986") {
			await user.keyboard(char);
		}

		await waitFor(() => {
			const input = screen.getByLabelText(
				"SAB NO. Filter Input",
			) as HTMLInputElement;
			expect(input).toBe(sabInput);
			expect(input.value).toBe("0986");
			expect(document.activeElement).toBe(input);
			expect(displayedIds(getApi())).toEqual(["r1"]);
		});
	});

	it("keeps the filter applied through unrelated parent re-renders", async () => {
		const { user, getApi, sabInput } = await setup();

		await user.click(sabInput);
		await user.keyboard("1630");
		await waitFor(() => expect(displayedIds(getApi())).toEqual(["r1", "r2"]));

		await user.click(screen.getByText("rerender"));
		await user.click(screen.getByText("rerender"));

		const input = screen.getByLabelText(
			"SAB NO. Filter Input",
		) as HTMLInputElement;
		expect(input.value).toBe("1630");
		expect(displayedIds(getApi())).toEqual(["r1", "r2"]);
	});

	it("filters the QTY number column with Equals and Greater than", async () => {
		const { getApi } = await setup();
		const api = getApi();

		await act(async () => {
			await api.setColumnFilterModel("quantity", {
				filterType: "number",
				type: "equals",
				filter: 1,
			});
			api.onFilterChanged();
		});
		await waitFor(() => expect(displayedIds(api)).toEqual(["r1"]));

		await act(async () => {
			await api.setColumnFilterModel("quantity", {
				filterType: "number",
				type: "greaterThan",
				filter: 1,
			});
			api.onFilterChanged();
		});
		await waitFor(() => expect(displayedIds(api)).toEqual(["r2", "r3"]));
	});

	it("types into the QTY number floating filter and narrows rows", async () => {
		const { user, getApi } = await setup();
		await screen.findAllByLabelText("QTY Filter Input");
		const qtyInput = getQtyInput();

		await user.click(qtyInput);
		await user.keyboard("2");

		await waitFor(() => {
			const input = getQtyInput();
			expect(input).toBe(qtyInput);
			expect(input.value).toBe("2");
			expect(document.activeElement).toBe(input);
			expect(displayedIds(getApi())).toEqual(["r2"]);
		});
	});

	it("lets you type in the column filter popup without a re-render loop", async () => {
		// AG Grid closes a popup once its anchor looks out of view; jsdom reports
		// every rect as 0x0, so give elements a fixed, visible box for this test.
		const rectSpy = vi
			.spyOn(Element.prototype, "getBoundingClientRect")
			.mockReturnValue(
				DOMRect.fromRect({ x: 10, y: 10, width: 100, height: 30 }),
			);
		try {
			const { user, getApi } = await setup();
			const sabCell = screen
				.getByLabelText("SAB NO. Filter Input")
				.closest(".ag-floating-filter") as HTMLElement;
			const popupButton = sabCell.querySelector(
				".ag-floating-filter-button-button",
			) as HTMLElement;

			await user.click(popupButton);
			const popupInput = await waitFor(() => {
				const el = document.querySelector(
					".ag-popup .ag-filter input[type=text]",
				) as HTMLInputElement | null;
				expect(el).not.toBeNull();
				return el as HTMLInputElement;
			});

			// Let any feedback loop (model update -> parent render -> grid refresh) run.
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 300));
			});
			const updatesAfterOpen = modelUpdates;
			expect(updatesAfterOpen).toBeLessThan(10);

			// jsdom has no layout, so a pointer click inside the popup reads as an
			// outside click and closes it; focus directly (AG Grid does this on open).
			act(() => popupInput.focus());
			await user.keyboard("1");
			await user.keyboard("630");
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 300));
			});

			const current = document.querySelector(
				".ag-popup .ag-filter input[type=text]",
			) as HTMLInputElement;
			expect(current).toBe(popupInput);
			expect(current.value).toBe("1630");
			expect(document.activeElement).toBe(current);
			// Popup text filters apply after AG Grid's default 500ms debounce.
			await waitFor(
				() => expect(displayedIds(getApi())).toEqual(["r1", "r2"]),
				{ timeout: 2000 },
			);
			expect(modelUpdates - updatesAfterOpen).toBeLessThan(10);
		} finally {
			rectSpy.mockRestore();
		}
	});

	it("hides and shows the floating filter row when toggled", async () => {
		const { user } = await setup();

		await user.click(screen.getByText("toggle-filters"));
		await waitFor(() =>
			expect(screen.queryByLabelText("SAB NO. Filter Input")).toBeNull(),
		);

		await user.click(screen.getByText("toggle-filters"));
		expect(
			await screen.findByLabelText("SAB NO. Filter Input"),
		).toBeInTheDocument();
	});

	it("composes with rows already narrowed by the toolbar filters", async () => {
		// Toolbar filters (stage -> company -> model) narrow `rowData` before the grid.
		const toolbarNarrowed = [ROWS[0], ROWS[2]];
		const { user, getApi, sabInput } = await setup({
			rowData: toolbarNarrowed,
		});

		await user.click(sabInput);
		await user.keyboard("1630");

		await waitFor(() => expect(displayedIds(getApi())).toEqual(["r1"]));
	});

	it("deselects a selected row once a column filter hides it", async () => {
		const { user, getApi, sabInput } = await setup();
		const api = getApi();

		await act(async () => {
			selectById(api, ["r1", "r3"]);
		});
		expect(
			api
				.getSelectedRows()
				.map((r) => r.id)
				.sort(),
		).toEqual(["r1", "r3"]);

		await user.click(sabInput);
		await user.keyboard("1630");

		await waitFor(() => {
			expect(api.getSelectedRows().map((r) => r.id)).toEqual(["r1"]);
			expect(screen.getByTestId("selected-count").textContent).toBe("1");
		});
	});
});
