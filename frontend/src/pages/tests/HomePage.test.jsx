import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import HomePage from "../HomePage/HomePage";

// ------------------------
// MOCKS
// ------------------------

// Mock useNavigate from react-router-dom
const mockedNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockedNavigate,
}));

// Mock Calendar component
vi.mock("../../components/Calendar", () => ({
  default: () => <div data-testid="calendar">Calendar</div>,
}));

// Mock PlanCard component
vi.mock("../../components/StudyPlans/PlanCard", () => ({
  default: ({ plan, onSelect, onDelete }) => (
    <div data-testid="plan-card">
      <span>{plan.title}</span>
      <button onClick={() => onSelect(plan)}>Select</button>
      <button onClick={() => onDelete(plan.id)}>Delete</button>
    </div>
  ),
}));

// Mock CreatePlanForm component
vi.mock("../../components/StudyPlans/CreatePlanForm", () => ({
  default: ({ onCreatePlan, onCancel }) => (
    <div data-testid="create-form">
      <button onClick={() => onCreatePlan({ id: "1", title: "New Plan" })}>
        Create
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock StudyPlanPage component
vi.mock("../StudyPlanPage", () => ({
  default: ({ plan, onBack }) => (
    <div data-testid="study-plan-page">
      <span>{plan.title}</span>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

// ------------------------
// TESTS
// ------------------------

describe("HomePage", () => {
  let user;

  beforeEach(() => {
    mockedNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();
    user = userEvent.setup();
    render(<HomePage />);
  });

  test("renders header, calendar, and empty state", async () => {
    expect(
      await screen.findByRole("heading", { name: "Studious" }),
    ).toBeInTheDocument();

    expect(await screen.findByTestId("calendar")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "No study plans yet" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", { name: "+ Create Study Plan" }),
    ).toBeInTheDocument();
  });

  test("opens and closes create plan form", async () => {
    await user.click(
      await screen.findByRole("button", { name: "New Study Plan" }),
    );
    expect(await screen.findByTestId("create-form")).toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("create-form")).not.toBeInTheDocument();
  });

  describe("menu interactions", () => {
    test("navigates to Settings", async () => {
      await user.click(await screen.findByLabelText("Menu"));
      await user.click(await screen.findByRole("button", { name: "Settings" }));

      expect(mockedNavigate).toHaveBeenCalledWith("/settings");
    });

    test("logs out and navigates to Login", async () => {
      await user.click(await screen.findByLabelText("Menu"));
      await user.click(await screen.findByRole("button", { name: "Log Out" }));

      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  describe("study plan interactions", () => {
    test("creating a plan adds it to the list", async () => {
      await user.click(
        await screen.findByRole("button", { name: "New Study Plan" }),
      );
      await user.click(await screen.findByRole("button", { name: "Create" }));

      expect(await screen.findByText("New Plan")).toBeInTheDocument();
    });

    test("selecting a plan shows StudyPlanPage", async () => {
      await user.click(
        await screen.findByRole("button", { name: "New Study Plan" }),
      );
      await user.click(await screen.findByRole("button", { name: "Create" }));
      await user.click(await screen.findByRole("button", { name: "Select" }));

      expect(await screen.findByTestId("study-plan-page")).toBeInTheDocument();
      expect(await screen.findByText("New Plan")).toBeInTheDocument();
    });

    test("deleting a study plan removes it from the list", async () => {
      await user.click(
        await screen.findByRole("button", { name: "New Study Plan" }),
      );
      await user.click(await screen.findByRole("button", { name: "Create" }));
      await user.click(await screen.findByRole("button", { name: "Delete" }));

      expect(screen.queryByText("New Plan")).not.toBeInTheDocument();
    });
  });
});
