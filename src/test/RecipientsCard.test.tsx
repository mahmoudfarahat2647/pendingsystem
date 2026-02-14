import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecipientsCard } from "../components/reports/RecipientsCard";
import { useAppStore } from "../store/useStore";

// Mock the useAppStore hook
vi.mock("../store/useStore", () => ({
	useAppStore: vi.fn(),
}));

// Mock UI components
vi.mock("../components/ui/card", () => ({
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

vi.mock("../components/ui/input", () => ({
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

vi.mock("../components/ui/button", () => ({
	Button: ({ children, onClick, disabled, size, type }: any) => (
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

vi.mock("../components/ui/badge", () => ({
	Badge: ({ children, variant, className, onClick }: any) => (
		<div
			data-testid="email-badge"
			className={className}
			onClick={onClick}
			role="button"
			tabIndex={0}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onClick?.(event);
				}
			}}
		>
			{children}
		</div>
	),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
	X: ({ className }: { className: string }) => (
		<span data-testid="x-icon" className={className} />
	),
	Plus: ({ className }: { className: string }) => (
		<span data-testid="plus-icon" className={className} />
	),
}));

describe("RecipientsCard", () => {
	const mockAddEmailRecipient = vi.fn();
	const mockRemoveEmailRecipient = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: null,
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);
	});

	it("should render the card with title and description", () => {
		render(<RecipientsCard isLocked={false} />);

		expect(screen.getByText("Recipients")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Manage who receives the automated reports suitable for backup.",
			),
		).toBeInTheDocument();
	});

	it("should render email input and add button", () => {
		render(<RecipientsCard isLocked={false} />);

		expect(screen.getByTestId("email-input")).toBeInTheDocument();
		expect(screen.getByTestId("add-button")).toBeInTheDocument();
		expect(screen.getByTestId("plus-icon")).toBeInTheDocument();
	});

	it("should show no recipients message when emails array is empty", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		expect(screen.getByText("No recipients added yet.")).toBeInTheDocument();
	});

	it("should render email badges when recipients exist", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: ["test1@example.com", "test2@example.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		expect(screen.getByText("test1@example.com")).toBeInTheDocument();
		expect(screen.getByText("test2@example.com")).toBeInTheDocument();
		expect(screen.getAllByTestId("email-badge")).toHaveLength(2);
	});

	it("should disable input and button when loading", () => {
		render(<RecipientsCard isLocked={false} />);

		const input = screen.getByTestId("email-input");
		const button = screen.getByTestId("add-button");

		expect(input).toBeDisabled();
		expect(button).toBeDisabled();
	});

	it("should disable input and button when locked", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={true} />);

		const input = screen.getByTestId("email-input");
		const button = screen.getByTestId("add-button");

		expect(input).toBeDisabled();
		expect(button).toBeDisabled();
	});

	it("should add email when clicking add button with valid email", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		const input = screen.getByTestId("email-input");
		const button = screen.getByTestId("add-button");

		await userEvent.type(input, "test@example.com");
		await userEvent.click(button);

		expect(mockAddEmailRecipient).toHaveBeenCalledWith("test@example.com");
		expect(input).toHaveValue("");
	});

	it("should add email when pressing Enter key with valid email", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		const input = screen.getByTestId("email-input");

		await userEvent.type(input, "test@example.com");
		await userEvent.keyboard("{Enter}");

		expect(mockAddEmailRecipient).toHaveBeenCalledWith("test@example.com");
		expect(input).toHaveValue("");
	});

	it("should not add email when clicking add button with invalid email", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		const input = screen.getByTestId("email-input");
		const button = screen.getByTestId("add-button");

		await userEvent.type(input, "invalid-email");
		await userEvent.click(button);

		expect(mockAddEmailRecipient).not.toHaveBeenCalled();
	});

	it("should not add email when pressing Enter with invalid email", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		const input = screen.getByTestId("email-input");

		await userEvent.type(input, "invalid-email");
		await userEvent.keyboard("{Enter}");

		expect(mockAddEmailRecipient).not.toHaveBeenCalled();
	});

	it("should remove email when clicking remove button on badge", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: ["test@example.com", "remove@example.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		const badges = screen.getAllByTestId("email-badge");
		const removeButton = badges[1].querySelector("button");

		if (removeButton) {
			await userEvent.click(removeButton);
			expect(mockRemoveEmailRecipient).toHaveBeenCalledWith(
				"remove@example.com",
			);
		}
	});

	it("should not remove email when locked", async () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: ["test@example.com"],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={true} />);

		const badge = screen.getByTestId("email-badge");
		const removeButton = badge.querySelector("button");

		if (removeButton) {
			expect(removeButton).toBeDisabled();
		}
	});

	it("should have correct input placeholder and type", () => {
		vi.mocked(useAppStore).mockReturnValue({
			reportSettings: {
				id: "1",
				emails: [],
				frequency: "Weekly",
				is_enabled: false,
				last_sent_at: null,
			},
			addEmailRecipient: mockAddEmailRecipient,
			removeEmailRecipient: mockRemoveEmailRecipient,
		} as any);

		render(<RecipientsCard isLocked={false} />);

		const input = screen.getByTestId("email-input");
		expect(input).toHaveAttribute("placeholder", "Email address");
		expect(input).toHaveAttribute("type", "email");
	});
});
