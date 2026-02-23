export type Priority_t = "low" | "medium" | "high";

export interface SubTask_t {
  taskID: string;
  title: string;
  completed: boolean;
}

export interface Task_t {
  taskID: string;
  toDoListID: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  priorityLevel: string;
  completed: boolean;
  reminderTime: Date;
  reminderSent: boolean;
  subTasks: SubTask_t[];
}
