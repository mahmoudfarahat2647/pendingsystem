import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	useReportSettingsQuery,
	useTriggerManualBackupMutation,
} from "@/hooks/queries/useReportSettingsQuery";
import { ManualActionCard } from "../components/reports/ManualActionCard";

vi.mock("@/hooks/queries/useReportSettingsQuery", () => ({
	useReportSettingsQuery: vi.fn(),
	useTriggerManualBackupMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("date-fns", () => ({
	format: vi.fn(() => "January 1, 2024 at 12:00 PM"),
}));

vi.mock("../components/ui/card", () => ({
	Card: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<div data-testid="card" className={className}>
			{children}
		</div>
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
	CardTitle: ({
		children,
		className,
	}: {
		children: React.ReactNode;
		className?: string;
	}) => (
		<div data-testid="card-title" className={className}>
			{children}
		</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({ children, onClick, disabled, variant, type }: any) => (
		<button
			data-testid="send-button"
			onClick={onClick}
			disabled={disabled}
			data-variant={variant}
			type={type}
		>
			{children}
		</button>
	),
}));

vi.mock("lucide-react", () => ({
	Loader2: ({ className }: { className: string }) => (
		<span data-testid="loader-icon" className={className} />
	),
	Send: ({ className }: { className: string }) => (
		<span data-testid="send-icon" className={className} />
	),
}));

import { toast } from "sonner";

describe("ManualActionCard", () => {
	const mutateAsync = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useReportSettingsQuery).mockReturnValue({ data: null } as any);
		vi.mocked(useTriggerManualBackupMutation).mockReturnValue({
			mutateAsync,
			isPending: false,
		} as any);
	});

	it("renders manual action content", () => {
		render(<ManualActionCard isLocked={false} />);
		expect(screen.getByText("Manual Action")).toBeInTheDocument();
	});

	it("shows loading message while mutation is pending", () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);
		vi.mocked(useTriggerManualBackupMutation).mockReturnValue({
			mutateAsync,
			isPending: true,
		} as any);

		render(<ManualActionCard isLocked={false} />);
		expect(screen.getByText("Sending...")).toBeInTheDocument();
		expect(screen.getByTestId("send-button")).toBeDisabled();
	});

	it("shows last sent time when available", () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: "2024-01-01T12:00:00Z",
			},
		} as any);

		render(<ManualActionCard isLocked={false} />);
		expect(
			screen.getByText("Last sent: January 1, 2024 at 12:00 PM"),
		).toBeInTheDocument();
	});

	it("triggers backup and shows success toast", async () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);
		mutateAsync.mockResolvedValue(undefined);

		render(<ManualActionCard isLocked={false} />);
		await userEvent.click(screen.getByTestId("send-button"));

		expect(mutateAsync).toHaveBeenCalled();
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Backup process started successfully",
			);
		});
	});

	it("shows error toast when trigger fails", async () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);
		mutateAsync.mockRejectedValue(new Error("Backup failed"));

		render(<ManualActionCard isLocked={false} />);
		await userEvent.click(screen.getByTestId("send-button"));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Failed to start backup");
		});
	});
});
