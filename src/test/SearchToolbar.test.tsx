import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import {
	SearchToolbar,
	type SearchToolbarProps,
} from "@/components/shared/search/SearchToolbar";
import { SEARCH_SOURCES } from "@/components/shared/search/searchSources";
import { TooltipProvider } from "@/components/ui/tooltip";

const renderWithProvider = (ui: React.ReactElement) => {
	return render(
		<LocaleProvider>
			<TooltipProvider>{ui}</TooltipProvider>
		</LocaleProvider>,
	);
};

const defaultProps: SearchToolbarProps = {
	selectedCount: 0,
	isSameSource: true,
	disabledReason: "",
	onBooking: vi.fn(),
	onArchive: vi.fn(),
	onSendToCallList: vi.fn(),
	onReorder: vi.fn(),
	onDelete: vi.fn(),
	onExtract: vi.fn(),
	onFilterToggle: vi.fn(),
	onReserve: vi.fn(),
	onUpdateStatus: vi.fn(),
	partStatuses: [],
	showFilters: false,
	modelOptions: [],
	selectedModels: [],
	onModelsChange: vi.fn(),
	sourceOptions: [],
	activeSourceFilter: null,
	onSourceFilterChange: vi.fn(),
};

describe("SearchToolbar", () => {
	describe("source filter dots", () => {
		it("renders one dot per SEARCH_SOURCES entry", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					sourceOptions={SEARCH_SOURCES.map(({ source }) => source)}
				/>,
			);

			for (const { source } of SEARCH_SOURCES) {
				expect(
					screen.getByRole("button", { name: source }),
				).toBeInTheDocument();
			}
		});

		it("disables dots for sources absent from sourceOptions", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					sourceOptions={["Main Sheet", "Orders"]}
				/>,
			);

			expect(
				screen.getByRole("button", { name: "Main Sheet" }),
			).not.toBeDisabled();
			expect(screen.getByRole("button", { name: "Orders" })).not.toBeDisabled();
			expect(screen.getByRole("button", { name: "Booking" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Call" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Archive" })).toBeDisabled();
			expect(screen.getByRole("button", { name: "Freeze" })).toBeDisabled();
		});

		it('marks the active dot with aria-pressed="true" and inactive dots with aria-pressed="false"', () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					sourceOptions={["Main Sheet", "Booking"]}
					activeSourceFilter="Main Sheet"
				/>,
			);

			expect(
				screen
					.getByRole("button", { name: "Main Sheet" })
					.getAttribute("aria-pressed"),
			).toBe("true");
			expect(
				screen
					.getByRole("button", { name: "Booking" })
					.getAttribute("aria-pressed"),
			).toBe("false");
		});

		it("calls onSourceFilterChange with the source when an available dot is clicked", () => {
			const onSourceFilterChange = vi.fn();

			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					sourceOptions={["Call"]}
					onSourceFilterChange={onSourceFilterChange}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Call" }));

			expect(onSourceFilterChange).toHaveBeenCalledTimes(1);
			expect(onSourceFilterChange).toHaveBeenCalledWith("Call");
		});

		it("does not call onSourceFilterChange when a disabled dot is clicked", () => {
			const onSourceFilterChange = vi.fn();

			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					sourceOptions={[]}
					onSourceFilterChange={onSourceFilterChange}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Archive" }));

			expect(onSourceFilterChange).not.toHaveBeenCalled();
		});

		it("renders the Clear control only when a source filter is active", () => {
			renderWithProvider(
				<SearchToolbar {...defaultProps} activeSourceFilter={null} />,
			);

			expect(screen.queryByText("Clear")).not.toBeInTheDocument();

			renderWithProvider(
				<SearchToolbar {...defaultProps} activeSourceFilter="Main Sheet" />,
			);

			expect(screen.getByText("Clear")).toBeInTheDocument();
		});

		it("calls onSourceFilterChange with null when Clear is clicked", () => {
			const onSourceFilterChange = vi.fn();

			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					activeSourceFilter="Main Sheet"
					onSourceFilterChange={onSourceFilterChange}
				/>,
			);

			fireEvent.click(screen.getByText("Clear"));

			expect(onSourceFilterChange).toHaveBeenCalledTimes(1);
			expect(onSourceFilterChange).toHaveBeenCalledWith(null);
		});
	});
});
