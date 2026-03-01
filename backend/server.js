const { setServers } = require("dns/promises")
setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/api/users/delete", async (req, res) => {
  const { username, password } = req.body;

  // get the user from the db
  const user = await User.findOne({ username: username });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  //verify the pword
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  //delete user data from db
  await User.deleteOne({ _id: user._id });

  //return success/error
  //return success
  res.json({ message: "Account deleted successfully" });
});  

const PORT = process.env.PORT || 5000;

// Wrap startup in async function to await database connection
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();