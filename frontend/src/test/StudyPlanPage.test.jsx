import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import StudyPlanPage from "../pages/StudyPlanPage";
import "@testing-library/jest-dom";

const mockPlan = {
  id: "1",
  title: "Math Plan",
  description: "Test description",
  milestones: [],
};

describe("StudyPlanPage", () => {
  it("renders plan title and description", () => {
    render(
      <StudyPlanPage
        plan={mockPlan}
        onBack={vi.fn()}
        setStudyPlans={vi.fn()}
      />,
    );

    expect(screen.getByText("Math Plan")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });
});
