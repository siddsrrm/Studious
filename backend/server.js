const { setServers } = require("dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const http = require("http");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const { initSocket } = require("./socket");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const taskRoutes = require("./routes/taskRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
const folderRoutes = require("./routes/folderRoutes");
const eventRoutes = require("./routes/eventRoutes");
const practiceQuestionRoutes = require("./routes/practiceQuestionRoutes");
const { startReminderJob } = require("./utils/reminderJob");
const friendRequestRoutes = require("./routes/friendRequestRoutes");

const app = express();

connectDB();
startReminderJob();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/study-plans", studyPlanRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/practice-questions", practiceQuestionRoutes);
app.use("/api/friendrequests", friendRequestRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
