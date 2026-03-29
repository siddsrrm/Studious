import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "../HomePage/HomePage";

// ------------------------
// MOCKS
// ------------------------

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockedNavigate,
}));

// Mock Calendar component
jest.mock("../../components/Calendar", () => () => (
  <div data-testid="calendar">Calendar</div>
));

// Mock PlanCard component
jest.mock(
  "../../components/StudyPlans/PlanCard",
  () =>
    ({ plan, onSelect, onDelete }) => (
      <div data-testid="plan-card">
        <span>{plan.title}</span>
        <button onClick={() => onSelect(plan)}>Select</button>
        <button onClick={() => onDelete(plan.id)}>Delete</button>
      </div>
    ),
);

// Mock CreatePlanForm component
jest.mock(
  "../../components/StudyPlans/CreatePlanForm",
  () =>
    ({ onCreatePlan, onCancel }) => (
      <div data-testid="create-form">
        <button onClick={() => onCreatePlan({ id: "1", title: "New Plan" })}>
          Create
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ),
);

// Mock StudyPlanPage component
jest.mock("../StudyPlanPage", () => ({ plan, onBack }) => (
  <div data-testid="study-plan-page">
    <span>{plan.title}</span>
    <button onClick={onBack}>Back</button>
  </div>
));

// ------------------------
// TESTS
// ------------------------

describe("HomePage", () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockedNavigate.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  test("renders header, calendar, and empty state", () => {
    render(<HomePage />);

    // Header
    expect(screen.getByText("Studious")).toBeInTheDocument();

    // Calendar
    expect(screen.getByTestId("calendar")).toBeInTheDocument();

    // Empty study plans
    expect(screen.getByText("No study plans yet")).toBeInTheDocument();
    expect(screen.getByText("+ Create Study Plan")).toBeInTheDocument();
  });

  test("opens and closes create plan form", () => {
    render(<HomePage />);

    // Open form
    fireEvent.click(screen.getByText("New Study Plan"));
    expect(screen.getByTestId("create-form")).toBeInTheDocument();

    // Close form
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("create-form")).not.toBeInTheDocument();
  });

  test("settings button navigates to settings", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByLabelText("Menu"));
    fireEvent.click(screen.getByText("Settings"));

    expect(mockedNavigate).toHaveBeenCalledWith("/settings");
  });

  test("logout button navigates to login", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByLabelText("Menu"));
    fireEvent.click(screen.getByText("Log Out"));

    expect(mockedNavigate).toHaveBeenCalledWith("/login");
  });

  test("creating a plan adds it to the list", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByText("New Study Plan"));
    fireEvent.click(screen.getByText("Create"));

    expect(screen.getByText("New Plan")).toBeInTheDocument();
  });

  test("selecting a plan shows StudyPlanPage", () => {
    render(<HomePage />);

    // Add a plan
    fireEvent.click(screen.getByText("New Study Plan"));
    fireEvent.click(screen.getByText("Create"));

    // Select the plan
    fireEvent.click(screen.getByText("Select"));

    expect(screen.getByTestId("study-plan-page")).toBeInTheDocument();
    expect(screen.getByText("New Plan")).toBeInTheDocument();
  });

  test("deleting a study plan removes it from the list", () => {
    render(<HomePage />);

    // Add a plan
    fireEvent.click(screen.getByText("New Study Plan"));
    fireEvent.click(screen.getByText("Create"));

    // Delete the plan
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.queryByText("New Plan")).not.toBeInTheDocument();
  });
});
