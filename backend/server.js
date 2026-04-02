const { setServers } = require("dns/promises");
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const taskRoutes = require("./routes/taskRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");
const folderRoutes = require("./routes/folderRoutes");
const eventRoutes = require("./routes/eventRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const practiceQuestionRoutes = require("./routes/practiceQuestionRoutes");
const leaderboardRouters = require("./routes/leaderboardRoutes");
const { startReminderJob } = require("./utils/reminderJob");

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
app.use("/api/upload", uploadRoutes);
app.use("/api/practice-questions", practiceQuestionRoutes);
app.use("/api/leaderboard", leaderboardRouters);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
