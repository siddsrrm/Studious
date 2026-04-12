import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";

import CreatePlanForm from "../components/StudyPlans/CreatePlanForm";

describe("Generate plan from syllabus UI", () => {
  it("opens the generator modal from CreatePlanForm", () => {
    render(<CreatePlanForm onCreatePlan={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /upload/i }));

    expect(
      screen.getByText(/generate study plan from syllabus/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/syllabus pdf/i)).toBeInTheDocument();
  });
});
