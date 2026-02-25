/*import type { Priority_t, SubTask_t, Task_t } from "../types/Task_t";

interface Props {
  task: Task_t;
  markCompleted: (id: string) => void;
}

const Task: React.FC<Props> = ({ task, markCompleted }) => {
  return (
    <div
      style={{
        border: "1px solid gray",
        margin: "10px",
        padding: "10px",
      }}
    >
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>Priority_t: {task.priorityLevel}</p>
      <p>Due: {task.endDate.toDateString()}</p>

      <button
        onClick={() => markCompleted(task.taskID)}
        disabled={task.completed}
      >
        {task.completed ? "Completed" : "Mark Complete"}
      </button>
    </div>
  );
};

export default Task;
*/
