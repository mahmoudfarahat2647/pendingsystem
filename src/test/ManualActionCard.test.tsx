import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ManualActionCard } from "../components/reports/ManualActionCard";
import { useAppStore } from "../store/useStore";

// Mock the useAppStore hook
vi.mock("../store/useStore", () => ({
	useAppStore: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock date-fns
vi.mock("date-fns", () => ({
	format: vi.fn((date, formatStr) => "January 1, 2024 at 12:00 PM"),
}));

// Mock UI components
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

// Mock Lucide icons
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
	const mockTriggerManualBackup = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: null,
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: false,
		} as any);
	});

	it("should render the card with title and description", () => {
		render(<ManualActionCard isLocked={false} />);

		expect(screen.getByText("Manual Action")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Immediately generate and send a backup report to all recipients.",
			),
		).toBeInTheDocument();
	});

	it("should render with destructive styling", () => {
		render(<ManualActionCard isLocked={false} />);

		const card = screen.getByTestId("card");
		expect(card).toHaveClass("border-destructive/20", "bg-destructive/5");

		const title = screen.getByTestId("card-title");
		expect(title).toHaveClass("text-destructive");
	});

	it("should show no reports sent message when last_sent_at is null", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		expect(screen.getByText("No reports sent yet.")).toBeInTheDocument();
	});

	it("should show last sent time when last_sent_at exists", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: "2024-01-01T12:00:00Z",
			},
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		expect(
			screen.getByText("Last sent: January 1, 2024 at 12:00 PM"),
		).toBeInTheDocument();
	});

	it("should show loading state when isReportSettingsLoading is true", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: true,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");
		expect(button).toBeDisabled();
		expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
		expect(screen.getByText("Sending...")).toBeInTheDocument();
	});

	it("should disable button when locked", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={true} />);

		const button = screen.getByTestId("send-button");
		expect(button).toBeDisabled();
	});

	it("should disable button when loading (no reportSettings)", () => {
		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");
		expect(button).toBeDisabled();
	});

	it("should call triggerManualBackup and show success toast on successful backup", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup.mockResolvedValue(undefined),
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");
		await userEvent.click(button);

		expect(mockTriggerManualBackup).toHaveBeenCalled();
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Backup process started successfully",
			);
		});
	});

	it("should show error toast on backup failure", async () => {
		const errorMessage = "Backup failed";
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup.mockRejectedValue(
				new Error(errorMessage),
			),
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");
		await userEvent.click(button);

		expect(mockTriggerManualBackup).toHaveBeenCalled();
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Failed to start backup");
		});
	});

	it("should show send button with correct text and icon when not loading", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");
		expect(button).toHaveAttribute("data-variant", "destructive");
		expect(screen.getByTestId("send-icon")).toBeInTheDocument();
		expect(screen.getByText("Send Backup Now")).toBeInTheDocument();
	});

	it("should prevent multiple simultaneous clicks", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100)),
			),
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");

		// First click
		await userEvent.click(button);

		// Second click should be ignored (button should be disabled during loading)
		expect(button).toBeDisabled();

		await waitFor(() => {
			expect(mockTriggerManualBackup).toHaveBeenCalledTimes(1);
		});
	});

	it("should have correct button accessibility attributes", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			triggerManualBackup: mockTriggerManualBackup,
			isReportSettingsLoading: false,
		} as any);

		render(<ManualActionCard isLocked={false} />);

		const button = screen.getByTestId("send-button");
		expect(button).toHaveAttribute("type", "button");
	});
});
