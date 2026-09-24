import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	SearchToolbar,
	type SearchToolbarProps,
} from "@/components/shared/search/SearchToolbar";
import { SEARCH_SOURCES } from "@/components/shared/search/searchSources";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ALLOWED_COMPANIES } from "@/domain/order/constants";

const renderWithProvider = (ui: React.ReactElement) => {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
};

const defaultProps: SearchToolbarProps = {
	selectedCount: 0,
	isSameSource: true,
	disabledReason: "",
	onBooking: vi.fn(),
	onArchive: vi.fn(),
	onSendToCallList: vi.fn(),
	onReorder: vi.fn(),
	onMoveToMain: vi.fn(),
	canMoveToMain: false,
	isMoveToMainEligible: false,
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
	availableCompanies: [],
	selectedCompanies: [],
	onCompanyFilterChange: vi.fn(),
	onCompanyFilterClear: vi.fn(),
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

	describe("company filter buttons", () => {
		it("renders one button per ALLOWED_COMPANIES entry", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					availableCompanies={[...ALLOWED_COMPANIES]}
				/>,
			);

			for (const company of ALLOWED_COMPANIES) {
				expect(
					screen.getByRole("button", { name: `Filter ${company}` }),
				).toBeInTheDocument();
			}
		});

		it("disables buttons for companies absent from availableCompanies", () => {
			renderWithProvider(
				<SearchToolbar {...defaultProps} availableCompanies={["Zeekr"]} />,
			);

			expect(
				screen.getByRole("button", { name: "Filter Zeekr" }),
			).not.toBeDisabled();
			expect(
				screen.getByRole("button", { name: "Filter Renault" }),
			).toBeDisabled();
		});

		it('marks a selected company with aria-pressed="true" and others with "false"', () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					availableCompanies={[...ALLOWED_COMPANIES]}
					selectedCompanies={["Zeekr"]}
				/>,
			);

			expect(
				screen
					.getByRole("button", { name: "Filter Zeekr" })
					.getAttribute("aria-pressed"),
			).toBe("true");
			expect(
				screen
					.getByRole("button", { name: "Filter Renault" })
					.getAttribute("aria-pressed"),
			).toBe("false");
		});

		it("calls onCompanyFilterChange with the company when an available button is clicked", () => {
			const onCompanyFilterChange = vi.fn();

			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					availableCompanies={["Zeekr"]}
					onCompanyFilterChange={onCompanyFilterChange}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Filter Zeekr" }));

			expect(onCompanyFilterChange).toHaveBeenCalledTimes(1);
			expect(onCompanyFilterChange).toHaveBeenCalledWith("Zeekr");
		});

		it("does not call onCompanyFilterChange when a disabled button is clicked", () => {
			const onCompanyFilterChange = vi.fn();

			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					availableCompanies={[]}
					onCompanyFilterChange={onCompanyFilterChange}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Filter Renault" }));

			expect(onCompanyFilterChange).not.toHaveBeenCalled();
		});

		it("renders the Clear control only when a company is selected", () => {
			renderWithProvider(
				<SearchToolbar {...defaultProps} selectedCompanies={[]} />,
			);

			expect(screen.queryByText("Clear")).not.toBeInTheDocument();

			renderWithProvider(
				<SearchToolbar {...defaultProps} selectedCompanies={["Zeekr"]} />,
			);

			expect(screen.getByText("Clear")).toBeInTheDocument();
		});

		it("calls onCompanyFilterClear when Clear is clicked", () => {
			const onCompanyFilterClear = vi.fn();

			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					selectedCompanies={["Zeekr"]}
					onCompanyFilterClear={onCompanyFilterClear}
				/>,
			);

			fireEvent.click(screen.getByText("Clear"));

			expect(onCompanyFilterClear).toHaveBeenCalledTimes(1);
		});

		it("has an accessible name distinct from the source filter's Clear control", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					activeSourceFilter="Main Sheet"
					selectedCompanies={["Zeekr"]}
				/>,
			);

			// Both Clear controls can render at once; their accessible names must
			// differ so a screen reader doesn't announce "Clear" twice.
			expect(
				screen.getByRole("button", { name: "Clear company filter" }),
			).toBeInTheDocument();
		});
	});

	describe("Move to Main Sheet action", () => {
		it("is not rendered when the permission is off", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					canMoveToMain={false}
					isMoveToMainEligible={true}
					selectedCount={2}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: /move to main sheet/i }),
			).not.toBeInTheDocument();
		});

		it("is rendered but disabled when the permission is on but the selection is not eligible", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					canMoveToMain={true}
					isMoveToMainEligible={false}
					selectedCount={2}
				/>,
			);
			const button = screen.getByRole("button", {
				name: /move to main sheet/i,
			});
			expect(button).toBeDisabled();
		});

		it("is rendered and enabled when the permission is on, the selection is eligible, and rows are selected", () => {
			const onMoveToMain = vi.fn();
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					canMoveToMain={true}
					isMoveToMainEligible={true}
					selectedCount={2}
					onMoveToMain={onMoveToMain}
				/>,
			);
			const button = screen.getByRole("button", {
				name: /move to main sheet/i,
			});
			expect(button).not.toBeDisabled();
			fireEvent.click(button);
			expect(onMoveToMain).toHaveBeenCalledTimes(1);
		});

		it("is disabled when eligible but nothing is selected", () => {
			renderWithProvider(
				<SearchToolbar
					{...defaultProps}
					canMoveToMain={true}
					isMoveToMainEligible={true}
					selectedCount={0}
				/>,
			);
			expect(
				screen.getByRole("button", { name: /move to main sheet/i }),
			).toBeDisabled();
		});
	});
});
