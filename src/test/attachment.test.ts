import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildStorageObjectPath,
	detectAttachmentKind,
	getAttachmentsBucket,
	hasAttachment,
	isSupportedAttachmentFile,
	isValidFileSize,
	sanitizeAttachmentLink,
} from "@/lib/attachment";

vi.mock("@/lib/env", () => ({
	env: {
		NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET: "attachments",
	},
}));

describe("attachment helpers", () => {
	describe("isSupportedAttachmentFile", () => {
		it("should accept image files", () => {
			const imageFile = new File([""], "test.jpg", { type: "image/jpeg" });
			expect(isSupportedAttachmentFile(imageFile)).toBe(true);
		});

		it("should accept PNG files", () => {
			const pngFile = new File([""], "test.png", { type: "image/png" });
			expect(isSupportedAttachmentFile(pngFile)).toBe(true);
		});

		it("should accept PDF files", () => {
			const pdfFile = new File([""], "test.pdf", { type: "application/pdf" });
			expect(isSupportedAttachmentFile(pdfFile)).toBe(true);
		});

		it("should reject unsupported file types", () => {
			const docFile = new File([""], "test.doc", {
				type: "application/msword",
			});
			expect(isSupportedAttachmentFile(docFile)).toBe(false);
		});

		it("should reject text files", () => {
			const txtFile = new File([""], "test.txt", { type: "text/plain" });
			expect(isSupportedAttachmentFile(txtFile)).toBe(false);
		});
	});

	describe("isValidFileSize", () => {
		it("should accept files under 5MB", () => {
			const smallFile = new File([""], "test.jpg", { type: "image/jpeg" });
			Object.defineProperty(smallFile, "size", { value: 4 * 1024 * 1024 });
			expect(isValidFileSize(smallFile)).toBe(true);
		});

		it("should accept files exactly at 5MB", () => {
			const exactFile = new File([""], "test.jpg", { type: "image/jpeg" });
			Object.defineProperty(exactFile, "size", { value: 5 * 1024 * 1024 });
			expect(isValidFileSize(exactFile)).toBe(true);
		});

		it("should reject files over 5MB", () => {
			const largeFile = new File([""], "test.jpg", { type: "image/jpeg" });
			Object.defineProperty(largeFile, "size", { value: 6 * 1024 * 1024 });
			expect(isValidFileSize(largeFile)).toBe(false);
		});
	});

	describe("detectAttachmentKind", () => {
		it("should return image-pdf when file is selected", () => {
			expect(detectAttachmentKind("some/path", true)).toBe("image-pdf");
		});

		it("should return link for empty value with no file", () => {
			expect(detectAttachmentKind(undefined, false)).toBe("link");
		});

		it("should return link for plain text path", () => {
			expect(detectAttachmentKind("C:\\Users\\Documents\\file", false)).toBe(
				"link",
			);
		});

		it("should return image-pdf for image URL", () => {
			expect(detectAttachmentKind("https://example.com/image.jpg", false)).toBe(
				"image-pdf",
			);
		});

		it("should return image-pdf for PDF URL", () => {
			expect(
				detectAttachmentKind("https://example.com/document.pdf", false),
			).toBe("image-pdf");
		});

		it("should return link for non-file URL", () => {
			expect(detectAttachmentKind("https://example.com/page", false)).toBe(
				"link",
			);
		});
	});

	describe("buildStorageObjectPath", () => {
		it("should build path with order folder structure", () => {
			const file = new File([""], "test-file.pdf", {
				type: "application/pdf",
			});
			const path = buildStorageObjectPath("order-123", file);

			expect(path).toBe("orders/order-123/test-file.pdf");
		});

		it("should sanitize filename with special characters", () => {
			const file = new File([""], "file with spaces & special#chars.pdf", {
				type: "application/pdf",
			});
			const path = buildStorageObjectPath("order-123", file);

			expect(path).not.toContain(" ");
			expect(path).not.toContain("&");
			expect(path).not.toContain("#");
		});
	});

	describe("getAttachmentsBucket", () => {
		it("should return default bucket name", () => {
			expect(getAttachmentsBucket()).toBe("attachments");
		});
	});

	describe("sanitizeAttachmentLink", () => {
		it("should strip wrapping double quotes", () => {
			expect(sanitizeAttachmentLink('"C:\\Test\\file.pdf"')).toBe(
				"C:\\Test\\file.pdf",
			);
		});

		it("should preserve values without wrapping quotes", () => {
			expect(sanitizeAttachmentLink("https://example.com/file.pdf")).toBe(
				"https://example.com/file.pdf",
			);
		});
	});

	describe("hasAttachment", () => {
		it("should return true when a link exists", () => {
			expect(hasAttachment({ attachmentLink: "C:\\Test\\file.pdf" })).toBe(true);
		});

		it("should return true when a file path exists", () => {
			expect(
				hasAttachment({ attachmentFilePath: "orders/order-1/test.pdf" }),
			).toBe(true);
		});

		it("should return false when both values are empty", () => {
			expect(
				hasAttachment({ attachmentLink: "", attachmentFilePath: "" }),
			).toBe(false);
		});
	});
});
