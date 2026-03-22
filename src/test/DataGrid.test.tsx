import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLiveGridStore } from "../store/useLiveGridStore";
import { useAppStore } from "../store/useStore";

let lastAgGridProps: Record<string, unknown> | null = null;

vi.mock("ag-grid-react", () => ({
	AgGridReact: (props: Record<string, unknown>) => {
		lastAgGridProps = props;
		return <div data-testid="ag-grid-react" />;
	},
}));

import { DataGrid } from "../components/grid/DataGrid";

describe("DataGrid layout restoration", () => {
	beforeEach(() => {
		lastAgGridProps = null;
		localStorage.clear();
		useAppStore.setState({
			gridStates: {},
			dirtyLayouts: {},
			defaultLayouts: {},
		});
		useLiveGridStore.setState({
			liveGridStates: {},
		});
	});

	it("should prefer the saved grid state over the default layout", () => {
		const savedState = {
			columnOrder: { orderedColIds: ["vin", "customer"] },
		} as never;
		const defaultState = {
			columnOrder: { orderedColIds: ["customer", "vin"] },
		} as never;

		useAppStore.getState().saveGridState("orders", savedState);
		useAppStore.getState().saveAsDefaultLayout("orders", defaultState);

		render(<DataGrid rowData={[]} columnDefs={[]} gridStateKey="orders" />);

		expect(lastAgGridProps?.initialState).toEqual(savedState);
	});

	it("should fall back to the saved default layout when no grid state exists", () => {
		const defaultState = {
			columnOrder: { orderedColIds: ["status", "vin"] },
		} as never;

		useAppStore.getState().saveAsDefaultLayout("orders", defaultState);

		render(<DataGrid rowData={[]} columnDefs={[]} gridStateKey="orders" />);

		expect(lastAgGridProps?.initialState).toEqual(defaultState);
	});
});
