import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RowModals } from "@/components/shared/RowModals";
import type { PendingRow } from "@/types";

const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

const editNoteModalProps = vi.fn();
vi.mock("@/components/shared/EditNoteModal", () => ({
	EditNoteModal: (props: Record<string, unknown>) => {
		editNoteModalProps(props);
		return null;
	},
}));

vi.mock("@/components/shared/EditReminderModal", () => ({
	EditReminderModal: () => null,
}));
vi.mock("@/components/shared/EditAttachmentModal", () => ({
	EditAttachmentModal: () => null,
}));
vi.mock("@/components/shared/ArchiveReasonModal", () => ({
	ArchiveReasonModal: () => null,
}));
vi.mock("@/components/shared/FreezeReasonModal", () => ({
	FreezeReasonModal: () => null,
}));

function makeRow(overrides: Partial<PendingRow> = {}): PendingRow {
	return {
		id: "row-1",
		noteHistory: "",
		attachmentFilePaths: [],
		attachmentLink: "",
		...overrides,
	} as unknown as PendingRow;
}

const noopProps = {
	onClose: vi.fn(),
	onSaveNote: vi.fn(),
	onSaveReminder: vi.fn(),
	onSaveAttachment: vi.fn(),
	onSaveArchive: vi.fn(),
};

describe("RowModals", () => {
	beforeEach(() => {
		editNoteModalProps.mockReset();
		mockToastError.mockReset();
	});

	it("passes the row's own stage to EditNoteModal when opening notes", () => {
		render(
			<RowModals
				activeModal="note"
				currentRow={makeRow({ stage: "freeze" })}
				{...noopProps}
			/>,
		);

		expect(editNoteModalProps).toHaveBeenCalledWith(
			expect.objectContaining({ open: true, stage: "freeze" }),
		);
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("does not crash and falls back gracefully when a row's stage is missing", () => {
		expect(() =>
			render(
				<RowModals
					activeModal="reminder"
					currentRow={makeRow({ stage: undefined })}
					{...noopProps}
				/>,
			),
		).not.toThrow();

		// Not the Notes modal, so no warning toast fires even though the
		// stage couldn't be resolved.
		expect(mockToastError).not.toHaveBeenCalled();
	});

	it("warns and passes no stage when opening Notes on a row with an unresolvable stage", () => {
		expect(() =>
			render(
				<RowModals
					activeModal="note"
					currentRow={makeRow({ stage: undefined })}
					{...noopProps}
				/>,
			),
		).not.toThrow();

		expect(mockToastError).toHaveBeenCalledWith(
			"Could not determine this record's stage; quick templates are unavailable for this row.",
		);
	});

	it("never substitutes another stage's scope when the row's stage is unresolvable", () => {
		render(
			<RowModals
				activeModal="note"
				currentRow={makeRow({ stage: "not-a-real-stage" as never })}
				{...noopProps}
			/>,
		);

		// Falling back to a real stage here would let the Notes modal read,
		// add and delete that stage's quick templates (issue #216's exact bug).
		const props = editNoteModalProps.mock.calls.at(-1)?.[0] as {
			stage?: string;
		};
		expect(props.stage).toBeUndefined();
	});
});
