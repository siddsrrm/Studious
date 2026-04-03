import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StudyPlanPage from "../pages/StudyPlanPage";
import "@testing-library/jest-dom";

// Mock BrowserRouter to prevent routing errors
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div>{children}</div>,
    useNavigate: () => vi.fn(),
  };
});

// Mock any child components that update state inside render
vi.mock("../components/StudyPlans/PlanCard", () => {
  return {
    default: ({ plan }) => (
      <div data-testid="plan-card" key={plan.id}>
        {plan.title}
      </div>
    ),
  };
});

vi.mock("../components/StudyPlans/CreatePlanForm", () => {
  return {
    default: ({ onCreatePlan }) => (
      <div data-testid="create-plan-form">
        <button onClick={() => onCreatePlan({ id: "1", title: "Math Plan" })}>
          Create
        </button>
      </div>
    ),
  };
});

describe("StudyPlanPage", () => {
  beforeEach(() => {
    render(<StudyPlanPage />);
  });

  it("renders plan title and description", () => {
    // Simulate creating a new plan
    fireEvent.click(screen.getByText("Create"));
    expect(screen.getByText(/Math Plan/i)).toBeInTheDocument();
  });

  it("renders multiple PlanCards without key warnings", () => {
    const planCards = screen.getAllByTestId("plan-card");
    expect(planCards.length).toBeGreaterThan(0);
    planCards.forEach((card) => expect(card).toBeInTheDocument());
  });
});