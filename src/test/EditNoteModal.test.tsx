import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, TextareaHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditNoteModal } from "@/components/shared/EditNoteModal";

const storeState = {
	noteTemplates: ["Template A", "Template B"],
	addNoteTemplate: vi.fn(),
	removeNoteTemplate: vi.fn(),
};

vi.mock("@/store/useStore", () => ({
	useAppStore: (
		selector: (state: typeof storeState) => typeof storeState.noteTemplates,
	) => selector(storeState),
}));

vi.mock("@/components/ui/dialog", () => ({
	Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
		open ? <div data-testid="dialog-root">{children}</div> : null,
	DialogContent: ({ children, ...props }: { children: ReactNode }) => (
		<div {...props}>{children}</div>
	),
	DialogDescription: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
	AlertDialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	AlertDialogAction: ({
		children,
		onClick,
	}: {
		children: ReactNode;
		onClick?: () => void;
	}) => <button onClick={onClick}>{children}</button>,
	AlertDialogCancel: ({ children }: { children: ReactNode }) => (
		<button>{children}</button>
	),
	AlertDialogContent: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogDescription: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogFooter: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogHeader: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogTitle: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	AlertDialogTrigger: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		type = "button",
		...props
	}: {
		children: ReactNode;
		onClick?: () => void;
		type?: "button" | "submit" | "reset";
	}) => (
		<button type={type} onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@/components/ui/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

vi.mock("@/components/ui/textarea", () => ({
	Textarea: (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
		<textarea {...props} />
	),
}));

describe("EditNoteModal", () => {
	beforeEach(() => {
		storeState.noteTemplates = ["Template A", "Template B"];
		storeState.addNoteTemplate.mockReset();
		storeState.removeNoteTemplate.mockReset();
	});

	it("composes multiple templates without inline tags and saves with one trailing tag", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		const onOpenChange = vi.fn();

		render(
			<EditNoteModal
				open={true}
				onOpenChange={onOpenChange}
				initialContent="Existing history #orders"
				onSave={onSave}
				sourceTag="booking"
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Template A" }));

		const newNoteField = screen.getByPlaceholderText(
			"Type a note for #booking...",
		);
		expect(newNoteField).toHaveValue("Template A");

		await user.click(screen.getByRole("button", { name: "Template B" }));
		expect(newNoteField).toHaveValue("Template A\nTemplate B");

		await user.click(screen.getByRole("button", { name: "SAVE NOTES" }));

		expect(onSave).toHaveBeenCalledWith(
			"Existing history #orders\nTemplate A\nTemplate B #booking",
		);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("saves typed notes with one fallback tag when sourceTag is missing", async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();

		render(
			<EditNoteModal
				open={true}
				onOpenChange={vi.fn()}
				initialContent=""
				onSave={onSave}
			/>,
		);

		await user.type(
			screen.getByPlaceholderText("Type a note for #undefined..."),
			"Call customer",
		);
		await user.click(screen.getByRole("button", { name: "SAVE NOTES" }));

		expect(onSave).toHaveBeenCalledWith("Call customer #note");
	});
});
