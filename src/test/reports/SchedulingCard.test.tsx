import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	useReportSettingsQuery,
	useUpdateReportSettingsMutation,
} from "@/hooks/queries/reports/useReportSettingsQuery";
import { SchedulingCard } from "../../components/reports/SchedulingCard";

vi.mock("@/hooks/queries/reports/useReportSettingsQuery", () => ({
	useReportSettingsQuery: vi.fn(),
	useUpdateReportSettingsMutation: vi.fn(),
}));

vi.mock("../../components/ui/card", () => ({
	Card: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="card">{children}</div>
	),
	CardContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="card-content">{children}</div>
	),
	CardDescription: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="card-description">{children}</div>
	),
	CardHeader: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="card-header">{children}</div>
	),
	CardTitle: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="card-title">{children}</div>
	),
}));

vi.mock("../../components/ui/label", () => ({
	Label: ({ children, htmlFor, ...props }: any) => (
		<label data-testid="label" htmlFor={htmlFor} {...props}>
			{children}
		</label>
	),
}));

vi.mock("../../components/ui/switch", () => ({
	Switch: ({ checked, onCheckedChange, disabled, id }: any) => (
		<input
			data-testid="switch"
			type="checkbox"
			checked={checked}
			onChange={(e) => onCheckedChange(e.target.checked)}
			disabled={disabled}
			id={id}
		/>
	),
}));

vi.mock("../../components/reports/FrequencyPicker", () => ({
	default: ({ value, onChange, disabled }: any) => (
		<select
			data-testid="frequency-picker"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
		>
			<option value="Weekly">Weekly</option>
			<option value="Monthly">Monthly</option>
			<option value="Yearly">Yearly</option>
		</select>
	),
}));

describe("SchedulingCard", () => {
	const mutate = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useReportSettingsQuery).mockReturnValue({ data: null } as any);
		vi.mocked(useUpdateReportSettingsMutation).mockReturnValue({
			mutate,
		} as any);
	});

	it("renders title and description", () => {
		render(<SchedulingCard isLocked={false} />);
		expect(screen.getByText("Scheduling")).toBeInTheDocument();
	});

	it("disables controls while settings are loading", () => {
		render(<SchedulingCard isLocked={false} />);
		expect(screen.getByTestId("switch")).toBeDisabled();
		expect(screen.getByTestId("frequency-picker")).toBeDisabled();
	});

	it("updates is_enabled when switch changes", () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);

		render(<SchedulingCard isLocked={false} />);
		fireEvent.click(screen.getByTestId("switch"));
		expect(mutate).toHaveBeenCalledWith({ is_enabled: true });
	});

	it("updates frequency when picker changes", () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: true,
				last_sent_at: null,
			},
		} as any);

		render(<SchedulingCard isLocked={false} />);
		fireEvent.change(screen.getByTestId("frequency-picker"), {
			target: { value: "Monthly" },
		});
		expect(mutate).toHaveBeenCalledWith({ frequency: "Monthly" });
	});

	it("disables controls when card is locked", () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: true,
				last_sent_at: null,
			},
		} as any);

		render(<SchedulingCard isLocked={true} />);
		expect(screen.getByTestId("switch")).toBeDisabled();
		expect(screen.getByTestId("frequency-picker")).toBeDisabled();
	});
});
