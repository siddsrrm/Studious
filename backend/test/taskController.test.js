const taskController = require("../controllers/taskController");
const Task = require("../models/Task");

jest.mock("../models/Task");

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

const USER_ID = "user123";

//getTasks
describe("getTasks", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when studyPlanId is missing", async () => {
    const req = { query: {}, user: { userId: USER_ID } };
    await taskController.getTasks(req, res);
    expect(Task.find).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "studyPlanId is required" });
  });

  test("returns tasks for the given study plan", async () => {
    const mockTasks = [{ _id: "t1", title: "Task 1" }];
    Task.find.mockResolvedValue(mockTasks);
    const req = { query: { studyPlanId: "plan1" }, user: { userId: USER_ID } };
    await taskController.getTasks(req, res);
    expect(Task.find).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanID: "plan1",
    });
    expect(res.json).toHaveBeenCalledWith(mockTasks);
  });

  test("returns empty array when no tasks exist", async () => {
    Task.find.mockResolvedValue([]);
    const req = { query: { studyPlanId: "plan1" }, user: { userId: USER_ID } };
    await taskController.getTasks(req, res);
    expect(res.json).toHaveBeenCalledWith([]);
  });
});

//createTask
describe("createTask", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 400 when studyPlanID is missing", async () => {
    const req = { body: { title: "My Task" }, user: { userId: USER_ID } };
    await taskController.createTask(req, res);
    expect(Task.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "studyPlanID is required" });
  });

  test("creates task with provided fields", async () => {
    const mockTask = {
      _id: "t1",
      ownerID: USER_ID,
      studyPlanID: "plan1",
      title: "Test Task",
      description: "Some description",
      priority: "high",
      dueDate: "2025-12-01",
      subTasks: [],
    };
    Task.create.mockResolvedValue(mockTask);
    const req = {
      body: {
        studyPlanID: "plan1",
        title: "Test Task",
        description: "Some description",
        priority: "high",
        dueDate: "2025-12-01",
      },
      user: { userId: USER_ID },
    };
    await taskController.createTask(req, res);
    expect(Task.create).toHaveBeenCalledWith({
      ownerID: USER_ID,
      studyPlanID: "plan1",
      title: "Test Task",
      description: "Some description",
      priority: "high",
      dueDate: "2025-12-01",
      subTasks: [],
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockTask);
  });

  test("defaults title to 'Untitled' when title is not provided", async () => {
    Task.create.mockResolvedValue({ _id: "t1", title: "Untitled" });
    const req = {
      body: { studyPlanID: "plan1" },
      user: { userId: USER_ID },
    };
    await taskController.createTask(req, res);
    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Untitled" })
    );
  });

  test("defaults priority to 'medium' when not provided", async () => {
    Task.create.mockResolvedValue({ _id: "t1", priority: "medium" });
    const req = {
      body: { studyPlanID: "plan1" },
      user: { userId: USER_ID },
    };
    await taskController.createTask(req, res);
    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({ priority: "medium" })
    );
  });

  test("defaults dueDate to null when not provided", async () => {
    Task.create.mockResolvedValue({ _id: "t1", dueDate: null });
    const req = {
      body: { studyPlanID: "plan1" },
      user: { userId: USER_ID },
    };
    await taskController.createTask(req, res);
    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: null })
    );
  });
});

//updateTask
describe("updateTask", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 403 when task does not exist", async () => {
    Task.findById.mockResolvedValue(null);
    const req = {
      params: { id: "t1" },
      body: { title: "Updated" },
      user: { userId: USER_ID },
    };
    await taskController.updateTask(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("returns 403 when user is not the owner", async () => {
    Task.findById.mockResolvedValue({
      _id: "t1",
      ownerID: { toString: () => "otherUser" },
    });
    const req = {
      params: { id: "t1" },
      body: { title: "Updated" },
      user: { userId: USER_ID },
    };
    await taskController.updateTask(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("calls updateTask schema method and returns updated task", async () => {
    const mockUpdatedTask = {
      _id: "t1",
      title: "New Title",
      description: "New description",
      completed: true,
      priority: "high",
      dueDate: "2025-12-01",
    };
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      updateTask: jest.fn().mockResolvedValue(mockUpdatedTask),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1" },
      body: { title: "New Title", description: "New description", completed: true, priority: "high", dueDate: "2025-12-01" },
      user: { userId: USER_ID },
    };
    await taskController.updateTask(req, res);
    expect(mockTask.updateTask).toHaveBeenCalledWith(req.body);
    expect(res.json).toHaveBeenCalledWith(mockUpdatedTask);
  });

  test("does not overwrite fields that are not provided", async () => {
    const mockUpdatedTask = {
      _id: "t1",
      title: "Existing Title",
      priority: "medium",
      completed: true,
    };
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      updateTask: jest.fn().mockResolvedValue(mockUpdatedTask),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1" },
      body: { completed: true },
      user: { userId: USER_ID },
    };
    await taskController.updateTask(req, res);
    expect(mockTask.updateTask).toHaveBeenCalledWith(req.body);
    expect(res.json).toHaveBeenCalledWith(mockUpdatedTask);
  });

  test("returns 500 on server error", async () => {
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      updateTask: jest.fn().mockRejectedValue(new Error("DB error")),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1" },
      body: { title: "New Title" },
      user: { userId: USER_ID },
    };
    await taskController.updateTask(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

//deleteTask
describe("deleteTask", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 when task does not exist", async () => {
    Task.findById.mockResolvedValue(null);
    const req = { params: { id: "t1" }, user: { userId: USER_ID } };
    await taskController.deleteTask(req, res);
    expect(Task.deleteOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Task.findById.mockResolvedValue({
      _id: "t1",
      ownerID: { toString: () => "otherUser" },
    });
    const req = { params: { id: "t1" }, user: { userId: USER_ID } };
    await taskController.deleteTask(req, res);
    expect(Task.deleteOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("deletes the task and returns success message", async () => {
    const mockTask = { _id: "t1", ownerID: { toString: () => USER_ID } };
    Task.findById.mockResolvedValue(mockTask);
    Task.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const req = { params: { id: "t1" }, user: { userId: USER_ID } };
    await taskController.deleteTask(req, res);
    expect(Task.deleteOne).toHaveBeenCalledWith({ _id: "t1" });
    expect(res.json).toHaveBeenCalledWith({ message: "Task deleted" });
  });
});

//createSubTask
describe("createSubTask", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 when task does not exist", async () => {
    Task.findById.mockResolvedValue(null);
    const req = {
      params: { id: "t1" },
      body: { title: "SubTask 1" },
      user: { userId: USER_ID },
    };
    await taskController.createSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Task.findById.mockResolvedValue({
      _id: "t1",
      ownerID: { toString: () => "otherUser" },
    });
    const req = {
      params: { id: "t1" },
      body: { title: "SubTask 1" },
      user: { userId: USER_ID },
    };
    await taskController.createSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("returns 400 when title is missing", async () => {
    Task.findById.mockResolvedValue({
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      subTasks: [],
      save: jest.fn(),
    });
    const req = {
      params: { id: "t1" },
      body: {},
      user: { userId: USER_ID },
    };
    await taskController.createSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Title is required" });
  });

  test("creates subtask and returns updated task", async () => {
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      subTasks: { push: jest.fn() },
      save: jest.fn().mockResolvedValue(true),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1" },
      body: { title: "SubTask 1", description: "Sub description" },
      user: { userId: USER_ID },
    };
    await taskController.createSubTask(req, res);
    expect(mockTask.subTasks.push).toHaveBeenCalledWith({
      ownerID: USER_ID,
      taskID: mockTask._id,
      title: "SubTask 1",
      description: "Sub description",
      completed: false,
    });
    expect(mockTask.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockTask);
  });

  test("defaults description to empty string when not provided", async () => {
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      subTasks: { push: jest.fn() },
      save: jest.fn().mockResolvedValue(true),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1" },
      body: { title: "SubTask 1" },
      user: { userId: USER_ID },
    };
    await taskController.createSubTask(req, res);
    expect(mockTask.subTasks.push).toHaveBeenCalledWith(
      expect.objectContaining({ description: "" })
    );
  });
});

//updateSubTask
describe("updateSubTask", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 when task does not exist", async () => {
    Task.findById.mockResolvedValue(null);
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      body: { title: "Updated SubTask" },
      user: { userId: USER_ID },
    };
    await taskController.updateSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Task.findById.mockResolvedValue({
      _id: "t1",
      ownerID: { toString: () => "otherUser" },
    });
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      body: { title: "Updated SubTask" },
      user: { userId: USER_ID },
    };
    await taskController.updateSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("returns 404 when subtask does not exist", async () => {
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      updateSubTask: jest.fn().mockRejectedValue(new Error("Subtask not found")),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      body: { title: "Updated SubTask" },
      user: { userId: USER_ID },
    };
    await taskController.updateSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Subtask not found" });
  });

  test("updates subtask fields and saves", async () => {
    const mockUpdatedTask = {
      _id: "t1",
      subTasks: [{ _id: "st1", title: "New SubTask", description: "New desc", completed: true }],
    };
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      updateSubTask: jest.fn().mockResolvedValue(mockUpdatedTask),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      body: { title: "New SubTask", description: "New desc", completed: true },
      user: { userId: USER_ID },
    };
    await taskController.updateSubTask(req, res);
    expect(mockTask.updateSubTask).toHaveBeenCalledWith("st1", req.body);
    expect(res.json).toHaveBeenCalledWith(mockUpdatedTask);
  });
});

//deleteSubTask
describe("deleteSubTask", () => {
  let res;
  beforeEach(() => {
    res = makeRes();
    jest.clearAllMocks();
  });

  test("returns 404 when task does not exist", async () => {
    Task.findById.mockResolvedValue(null);
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      user: { userId: USER_ID },
    };
    await taskController.deleteSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Task not found" });
  });

  test("returns 403 when user is not the owner", async () => {
    Task.findById.mockResolvedValue({
      _id: "t1",
      ownerID: { toString: () => "otherUser" },
    });
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      user: { userId: USER_ID },
    };
    await taskController.deleteSubTask(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" });
  });

  test("removes the subtask and returns updated task", async () => {
    const mockTask = {
      _id: "t1",
      ownerID: { toString: () => USER_ID },
      subTasks: { pull: jest.fn() },
      save: jest.fn().mockResolvedValue(true),
    };
    Task.findById.mockResolvedValue(mockTask);
    const req = {
      params: { id: "t1", subTaskId: "st1" },
      user: { userId: USER_ID },
    };
    await taskController.deleteSubTask(req, res);
    expect(mockTask.subTasks.pull).toHaveBeenCalledWith({ _id: "st1" });
    expect(mockTask.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockTask);
  });
});