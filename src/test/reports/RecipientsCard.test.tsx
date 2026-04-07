import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	useAddEmailRecipientMutation,
	useRemoveEmailRecipientMutation,
	useReportSettingsQuery,
} from "@/hooks/queries/reports/useReportSettingsQuery";
import { RecipientsCard } from "../../components/reports/RecipientsCard";

vi.mock("@/hooks/queries/reports/useReportSettingsQuery", () => ({
	useReportSettingsQuery: vi.fn(),
	useAddEmailRecipientMutation: vi.fn(),
	useRemoveEmailRecipientMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
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

vi.mock("../../components/ui/input", () => ({
	Input: ({ value, onChange, onKeyDown, disabled, placeholder, type }: any) => (
		<input
			data-testid="email-input"
			value={value}
			onChange={onChange}
			onKeyDown={onKeyDown}
			disabled={disabled}
			placeholder={placeholder}
			type={type}
		/>
	),
}));

vi.mock("../../components/ui/button", () => ({
	Button: ({ children, onClick, disabled, type }: any) => (
		<button
			data-testid="add-button"
			onClick={onClick}
			disabled={disabled}
			type={type}
		>
			{children}
		</button>
	),
}));

vi.mock("../../components/ui/badge", () => ({
	Badge: ({ children, className }: any) => (
		<div data-testid="email-badge" className={className}>
			{children}
		</div>
	),
}));

vi.mock("lucide-react", () => ({
	X: ({ className }: { className: string }) => (
		<span data-testid="x-icon" className={className} />
	),
	Plus: ({ className }: { className: string }) => (
		<span data-testid="plus-icon" className={className} />
	),
}));

import { toast } from "sonner";

describe("RecipientsCard", () => {
	const addMutate = vi.fn();
	const removeMutate = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useReportSettingsQuery).mockReturnValue({ data: null } as any);
		vi.mocked(useAddEmailRecipientMutation).mockReturnValue({
			mutate: addMutate,
		} as any);
		vi.mocked(useRemoveEmailRecipientMutation).mockReturnValue({
			mutate: removeMutate,
		} as any);
	});

	it("disables input while loading", () => {
		render(<RecipientsCard isLocked={false} />);
		expect(screen.getByTestId("email-input")).toBeDisabled();
		expect(screen.getByTestId("add-button")).toBeDisabled();
	});

	it("renders existing recipients", () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: ["a@test.com", "b@test.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);

		render(<RecipientsCard isLocked={false} />);
		expect(screen.getByText("a@test.com")).toBeInTheDocument();
		expect(screen.getByText("b@test.com")).toBeInTheDocument();
	});

	it("adds a valid email", async () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);

		render(<RecipientsCard isLocked={false} />);
		await userEvent.type(screen.getByTestId("email-input"), "test@example.com");
		await userEvent.click(screen.getByTestId("add-button"));
		expect(addMutate).toHaveBeenCalledWith("test@example.com");
		expect(screen.getByTestId("email-input")).toHaveValue("");
	});

	it("does not add invalid email", async () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);

		render(<RecipientsCard isLocked={false} />);
		await userEvent.type(screen.getByTestId("email-input"), "user@");
		await userEvent.click(screen.getByTestId("add-button"));
		expect(addMutate).not.toHaveBeenCalled();
	});

	it("shows toast error for invalid email", async () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);

		render(<RecipientsCard isLocked={false} />);
		await userEvent.type(screen.getByTestId("email-input"), "invalid");
		await userEvent.click(screen.getByTestId("add-button"));
		expect(toast.error).toHaveBeenCalledWith(
			"Please enter a valid email address",
		);
	});

	it("removes an email", async () => {
		vi.mocked(useReportSettingsQuery).mockReturnValue({
			data: {
				id: "1",
				emails: ["keep@test.com", "remove@test.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
		} as any);

		render(<RecipientsCard isLocked={false} />);
		const badges = screen.getAllByTestId("email-badge");
		const removeButton = badges[1].querySelector("button");
		if (removeButton) {
			await userEvent.click(removeButton);
		}
		expect(removeMutate).toHaveBeenCalledWith("remove@test.com");
	});
});
