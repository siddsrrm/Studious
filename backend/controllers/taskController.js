const Task = require("../models/Task");

exports.getTasks = async (req, res) => {
    try {
        const { studyPlanId } = req.query;
        if (!studyPlanId) return res.status(400).json({ message: "studyPlanId is required" });
        const tasks = await Task.find({ ownerID: req.user.userId, studyPlanID: studyPlanId });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks", error: err.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const { studyPlanID, title, description, priority, dueDate } = req.body;
        if (!studyPlanID) return res.status(400).json({ message: "studyPlanID is required" });
        const task = await Task.create({
            ownerID: req.user.userId,
            studyPlanID,
            title: title || "Untitled",
            description: description || "",
            priority: priority || "medium",
            dueDate: dueDate || null,
            subTasks: [],
        });
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: "Error creating task", error: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        if (task.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });
        const { title, description, completed, priority, dueDate } = req.body;
        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (completed !== undefined) task.completed = completed;
        if (priority !== undefined) task.priority = priority;
        if (dueDate !== undefined) task.dueDate = dueDate;
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Error updating task", error: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        if (task.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });
        await Task.deleteOne({ _id: task._id });
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting task", error: err.message });
    }
};

exports.createSubTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        if (task.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: "Title is required" });
        task.subTasks.push({
            ownerID: req.user.userId,
            taskID: task._id,
            title,
            description: description || "",
            completed: false,
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: "Error creating subtask", error: err.message });
    }
};

exports.updateSubTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        if (task.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });
        const subTask = task.subTasks.id(req.params.subTaskId);
        if (!subTask) return res.status(404).json({ message: "Subtask not found" });
        const { title, description, completed } = req.body;
        if (title !== undefined) subTask.title = title;
        if (description !== undefined) subTask.description = description;
        if (completed !== undefined) subTask.completed = completed;
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Error updating subtask", error: err.message });
    }
};

exports.deleteSubTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });
        if (task.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });
        task.subTasks.pull({ _id: req.params.subTaskId });
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: "Error deleting subtask", error: err.message });
    }
};