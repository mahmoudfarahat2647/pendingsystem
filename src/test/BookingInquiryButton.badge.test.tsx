import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingInquiryButton } from "@/components/shared/BookingInquiryButton";
import { NOTIFICATION_CANDIDATES_QUERY_KEY } from "@/lib/queryClient";
import type { PendingRow } from "@/types";
import { queryClient } from "./testQueryClient";

const fetchCandidatesMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/notifications/notificationCandidatesService", () => ({
	fetchDueNotificationCandidates: fetchCandidatesMock,
}));

// The modal pulls in booking/archive queries and heavy calendar UI unrelated to the
// badge; stub it so this test stays focused on the badge itself.
vi.mock("@/components/shared/BookingInquiryModal", () => ({
	BookingInquiryModal: () => <div data-testid="booking-inquiry-modal" />,
}));

function renderButton() {
	return render(
		<QueryClientProvider client={queryClient}>
			<BookingInquiryButton />
		</QueryClientProvider>,
	);
}

const bookingLine = (
	overrides: Partial<PendingRow> & { id: string; vin: string },
): PendingRow =>
	({
		bookingDate: "2026-09-28",
		stage: "booking",
		...overrides,
	}) as PendingRow;

function seedCandidates(rows: PendingRow[]) {
	queryClient.setQueryData(NOTIFICATION_CANDIDATES_QUERY_KEY, rows, {
		updatedAt: Date.now(),
	});
}

describe("BookingInquiryButton badge", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// A local (not UTC "Z") time, so this test's day-boundary assertions hold
		// regardless of the host machine's timezone.
		vi.setSystemTime(new Date(2026, 8, 28, 12, 0, 0));
		queryClient.clear();
		fetchCandidatesMock.mockReset();
		fetchCandidatesMock.mockResolvedValue([]);
	});

	afterEach(() => {
		queryClient.clear();
		vi.useRealTimers();
	});

	it("shows the count of distinct customers booked today", async () => {
		seedCandidates([
			bookingLine({ id: "1", vin: "VIN1" }),
			bookingLine({ id: "2", vin: "VIN2" }),
		]);
		renderButton();

		// Let the effect that sets todayKey after mount run.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("shows no badge when nobody is booked today", async () => {
		seedCandidates([]);
		renderButton();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(screen.queryByText("0")).not.toBeInTheDocument();
	});

	it("caps the display at 9+", async () => {
		seedCandidates(
			Array.from({ length: 11 }, (_, i) =>
				bookingLine({ id: String(i), vin: `VIN${i}` }),
			),
		);
		renderButton();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});

		expect(screen.getByText("9+")).toBeInTheDocument();
	});

	it("keeps the badge visible after opening the modal", async () => {
		seedCandidates([bookingLine({ id: "1", vin: "VIN1" })]);
		renderButton();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(screen.getByText("1")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /booking schedule/i }));

		expect(screen.getByTestId("booking-inquiry-modal")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("keeps the previous count when a refetch fails", async () => {
		seedCandidates([bookingLine({ id: "1", vin: "VIN1" })]);
		renderButton();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(screen.getByText("1")).toBeInTheDocument();

		// retry:1 (the app default) schedules a delayed retry on a fake timer;
		// advance past it rather than awaiting the refetch promise directly.
		fetchCandidatesMock.mockRejectedValue(new Error("network down"));
		void queryClient.refetchQueries({
			queryKey: NOTIFICATION_CANDIDATES_QUERY_KEY,
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(15_000);
		});

		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("switches to the next day's count after local midnight", async () => {
		seedCandidates([
			bookingLine({ id: "1", vin: "VIN1", bookingDate: "2026-09-28" }),
			bookingLine({ id: "2", vin: "VIN2", bookingDate: "2026-09-28" }),
			bookingLine({ id: "3", vin: "VIN3", bookingDate: "2026-09-29" }),
		]);
		renderButton();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(screen.getByText("2")).toBeInTheDocument();

		// Cross local midnight, then let the 60s recheck interval catch up.
		vi.setSystemTime(new Date(2026, 8, 29, 0, 0, 30));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});

		// Only the 29th's single customer counts now.
		expect(screen.getByText("1")).toBeInTheDocument();
	});
});
