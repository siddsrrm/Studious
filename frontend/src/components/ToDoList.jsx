import Task from "./Task.jsx";

const ToDoList = ({ toDoListId, studyPlanId, progress }) => {
  let tasks = [];

  const handleAddTask = () => {
    let index = tasks.length + 1;

    let title = "Task " + index;
    let description = "It's a task";

    let newTask = {
      taskID: index,
      toDoListID: 123,
      title: title,
      description: description,
      startDate: new Date(),
      endDate: new Date(),
      priorityLevel: "low",
      completed: false,
    };

    tasks = [...tasks, newTask];
  };

  handleAddTask();
  handleAddTask();
  handleAddTask();

  return (
    <>
      <div
        style={{ border: "2px solid black", padding: "10px", margin: "10px" }}
      >
        <h2>ToDoList</h2>
        <p>To-Do List Id: {toDoListId}</p>
        <p>Study Plan Id: {studyPlanId}</p>
        <p>Progress: {progress}</p>
        <p>Tasks:</p>
        <ul>
          {tasks.map((task) => (
            <li key={task.taskID}>{task.title}</li>
          ))}
        </ul>
      </div>
      <div>
        <ul>
          {tasks.map((task) => (
            <Task key={task.taskID} taskObj={task} />
          ))}
        </ul>
      </div>
    </>
  );
};

export default ToDoList;
