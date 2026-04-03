import React, { createContext, useContext, useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";

export const ToDoListContext = createContext();

export const ToDoListProvider = ({ children, studyPlanId }) => {
  const { tasks, createTask, editTask, deleteTask } = useTasks(studyPlanId);

  return (
    <ToDoListContext.Provider
      value={{
        tasks,
        onCreateTask: createTask,
        onEditTask: editTask,
        onDeleteTask: deleteTask,
      }}
    >
      {children}
    </ToDoListContext.Provider>
  );
};
