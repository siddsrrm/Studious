import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ToDoList from "../ToDoList";

// ------------------------
// MOCKS
// ------------------------

// Mock Task component
vi.mock("../Task", () => ({
  default: ({ taskObj, onUpdate, onDelete }) => (
    <div data-testid="task">
      <span>{taskObj.title}</span>
      <button onClick={() => onUpdate({ ...taskObj, completed: true })}>
        Complete
      </button>
      <button onClick={() => onDelete(taskObj._id)}>Delete</button>
    </div>
  ),
}));

// Mock fetch globally
global.fetch = vi.fn();

// ------------------------
// TESTS
// ------------------------
describe("ToDoList", () => {
  let user;
  const fakeTasks = [
    {
      _id: "1",
      title: "Task 1",
      completed: false,
      priority: "medium",
      dueDate: "2026-01-01",
    },
    {
      _id: "2",
      title: "Task 2",
      completed: true,
      priority: "high",
      dueDate: "2026-02-01",
    },
  ];
  const onProgressChange = vi.fn();

  // ------------------------
  // Helper: find a task by title inside task containers
  // ------------------------
  const findTaskByTitle = async (title) => {
    const taskContainers = await screen.findAllByTestId("task");
    return taskContainers.find((c) => {
      try {
        return within(c).getByText(title);
      } catch {
        return false;
      }
    });
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.setItem("token", "fake-token");
    user = userEvent.setup();

    // Default fetch mock for GET tasks
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeTasks,
    });

    render(<ToDoList studyPlanId="123" onProgressChange={onProgressChange} />);

    // Wait for tasks to load
    await waitFor(() =>
      expect(screen.queryByText("Loading tasks...")).not.toBeInTheDocument(),
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("renders header, filter bar, and tasks", () => {
    expect(
      screen.getByRole("heading", { name: "To-Do List" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Filter by priority")).toBeInTheDocument();

    // Use getAllByText to avoid multiple elements error
    expect(screen.getAllByText("Task 1")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Task 2")[0]).toBeInTheDocument();
  });

  describe("filter bar", () => {
    test("clears filters", async () => {
      const prioritySelect = screen.getByLabelText("Filter by priority");
      const dateFromInput = screen.getByLabelText("Filter due date from");
      const dateToInput = screen.getByLabelText("Filter due date to");
      const clearButton = screen.getByRole("button", { name: "Clear Filters" });

      // Change values
      await user.selectOptions(prioritySelect, "high");
      await user.type(dateFromInput, "2026-01-01");
      await user.type(dateToInput, "2026-12-31");

      // Clear filters
      await user.click(clearButton);

      expect(prioritySelect.value).toBe("all");
      expect(dateFromInput.value).toBe("");
      expect(dateToInput.value).toBe("");
    });
  });

  describe("task interactions", () => {
    test("adds a task", async () => {
      await user.click(screen.getByRole("button", { name: "+ Add Task" }));

      const addTitle = screen.getByPlaceholderText("Task title");
      const addButton = screen.getByRole("button", { name: "Add Task" });

      // Mock POST response for new task
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          updatedTask: { _id: "3", title: "New Task", completed: false },
        }),
      });

      await user.type(addTitle, "New Task");
      await user.click(addButton);

      const newTask = await findTaskByTitle("New Task");
      expect(newTask).toBeInTheDocument();
    });

    test("uploads an assignment PDF and appends generated tasks", async () => {
      const uploadButton = screen.getByRole("button", {
        name: /upload assignment pdf/i,
      });

      await user.click(uploadButton);

      const fileInput = screen.getByLabelText(/assignment pdf/i);
      const pdfFile = new File(["assignment text"], "assignment.pdf", {
        type: "application/pdf",
      });

      await user.upload(fileInput, pdfFile);

      // Mock response for generate-from-document endpoint
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Created 1 tasks",
          tasks: [
            {
              _id: "task-3",
              title: "Read assignment brief",
              completed: false,
              priority: "medium",
              dueDate: null,
              subTasks: [],
            },
          ],
        }),
      });

      await user.click(screen.getByRole("button", { name: /generate tasks/i }));

      const created = await findTaskByTitle("Read assignment brief");
      expect(created).toBeInTheDocument();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/tasks/generate-from-document"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    test("updates a task", async () => {
      const task1Container = await findTaskByTitle("Task 1");

      const completeButton = within(task1Container).getByRole("button", {
        name: "Complete",
      });
      await user.click(completeButton);

      await waitFor(() => expect(onProgressChange).toHaveBeenCalled());
    });

    test("deletes a task", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const task1Container = await findTaskByTitle("Task 1");

      const deleteButton = within(task1Container).getByRole("button", {
        name: "Delete",
      });
      await user.click(deleteButton);

      // Confirm the task is removed
      await waitFor(() =>
        expect(
          screen
            .getAllByTestId("task-title-summary")
            .map((el) => el.textContent),
        ).toEqual(["Task 2"]),
      );
    });
  });
});
