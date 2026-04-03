import { useContext } from "react";
import { ToDoListContext } from "../context/ToDoListContext";

export const useToDoList = () => {
  const context = useContext(ToDoListContext);
  if (!context)
    throw new Error("useToDoList must be used within a ToDoListProvider");
  return context;
};
