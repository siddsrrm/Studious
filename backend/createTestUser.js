require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

async function createTestUser() {
  try {
    await connectDB(); // Connect to MongoDB

    const email = "kluo11@icloud.com";
    const username = "kluo11"
    const password = "password";

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("Test user already exists:", email);
      return process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    user = await User.create({
      email,
      username,
      password: hashedPassword
    });

    console.log("Test user created:", user);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createTestUser();