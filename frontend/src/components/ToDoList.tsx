import React, { useState } from "react";
import Task from "./Task";
import type { Priority_t, SubTask_t, Task_t } from "../types/Task_t";
import type { ToDoList_t } from "../types/ToDoList_t";

const ToDoList: React.FC<ToDoList_t> = ({ toDoListID, initialTasks }) => {
  const [tasks, setTasks] = useState<Task_t[]>(initialTasks);

  // Mark task completed
  const markCompleted = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.taskID === taskId ? { ...task, completed: true } : task,
      ),
    );
  };

  const getPendingTasks = () => tasks.filter((task) => !task.completed);

  const getCompletedTasks = () => tasks.filter((task) => task.completed);

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return (getCompletedTasks().length / tasks.length) * 100;
  };

  const sortTasks = (by: "priority" | "date") => {
    const sorted = [...tasks].sort((a, b) => {
      if (by === "priority") {
        return a.priorityLevel.localeCompare(b.priorityLevel);
      }
      return a.endDate.getTime() - b.endDate.getTime();
    });
    setTasks(sorted);
  };

  return (
    <div>
      <h2>To Do List</h2>
      <p>Completion: {getCompletionRate().toFixed(1)}%</p>

      {tasks.map((task) => (
        <Task key={task.taskID} task={task} markCompleted={markCompleted} />
      ))}
    </div>
  );
};

export default ToDoList;
