import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BackupReportsTab from "../components/reports/BackupReportsTab";
import { SchedulingCard } from "../components/reports/SchedulingCard";
import { RecipientsCard } from "../components/reports/RecipientsCard";
import { ManualActionCard } from "../components/reports/ManualActionCard";

// Mock the child components to isolate the parent component testing
vi.mock("../components/reports/SchedulingCard", () => ({
    SchedulingCard: vi.fn(({ isLocked }) => (
        <div data-testid="scheduling-card" data-locked={isLocked}>
            SchedulingCard
        </div>
    )),
}));

vi.mock("../components/reports/RecipientsCard", () => ({
    RecipientsCard: vi.fn(({ isLocked }) => (
        <div data-testid="recipients-card" data-locked={isLocked}>
            RecipientsCard
        </div>
    )),
}));

vi.mock("../components/reports/ManualActionCard", () => ({
    ManualActionCard: vi.fn(({ isLocked }) => (
        <div data-testid="manual-action-card" data-locked={isLocked}>
            ManualActionCard
        </div>
    )),
}));

describe("BackupReportsTab", () => {
    it("should render all child components when not locked", () => {
        render(<BackupReportsTab isLocked={false} />);

        expect(screen.getByTestId("scheduling-card")).toBeInTheDocument();
        expect(screen.getByTestId("recipients-card")).toBeInTheDocument();
        expect(screen.getByTestId("manual-action-card")).toBeInTheDocument();

        expect(screen.getByTestId("scheduling-card")).toHaveAttribute("data-locked", "false");
        expect(screen.getByTestId("recipients-card")).toHaveAttribute("data-locked", "false");
        expect(screen.getByTestId("manual-action-card")).toHaveAttribute("data-locked", "false");
    });

    it("should pass isLocked prop correctly to all child components when locked", () => {
        render(<BackupReportsTab isLocked={true} />);

        expect(screen.getByTestId("scheduling-card")).toHaveAttribute("data-locked", "true");
        expect(screen.getByTestId("recipients-card")).toHaveAttribute("data-locked", "true");
        expect(screen.getByTestId("manual-action-card")).toHaveAttribute("data-locked", "true");
    });

    it("should render with correct layout structure", () => {
        const { container } = render(<BackupReportsTab isLocked={false} />);

        // Check for the main container with proper classes
        const mainContainer = container.firstChild;
        expect(mainContainer).toHaveClass("w-full", "space-y-6", "fade-in", "animate-in");

        // Check for the grid container
        const gridContainer = container.querySelector(".grid");
        expect(gridContainer).toHaveClass("grid", "gap-6", "md:grid-cols-[58%_42%]");
    });

    it("should render scheduling and recipients cards in the same grid row", () => {
        const { container } = render(<BackupReportsTab isLocked={false} />);

        const gridContainer = container.querySelector(".grid");
        expect(gridContainer).toContainElement(screen.getByTestId("scheduling-card"));
        expect(gridContainer).toContainElement(screen.getByTestId("recipients-card"));
    });

    it("should render manual action card outside the grid", () => {
        const { container } = render(<BackupReportsTab isLocked={false} />);

        const gridContainer = container.querySelector(".grid");
        const mainContainer = container.firstChild;

        expect(gridContainer).not.toContainElement(screen.getByTestId("manual-action-card"));
        expect(mainContainer).toContainElement(screen.getByTestId("manual-action-card"));
    });
});
