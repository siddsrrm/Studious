const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const jwt = require("jsonwebtoken")
require("dotenv").config()

// register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // check duplicate emails and usernames
    const existingEmail = await User.findOne({email})
    if (existingEmail) {
      return res.status(409).json({message: "Email already in use"})
    }

    const existingUsername = await User.findOne({username})
    if (existingUsername) {
      return res.status(409).json({message: "Username already in use"})
    }

    // encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({ username, email, password: hashedPassword})
    res.json({message: "User succcessfully created", userId: newUser._id})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
}

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // find user either by email or username
    const user = await User.findOne(email ? { email } : { username })
    if (!user) {
      return res.status(404).json({message: "User not found"})
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({message: "Invalid credentials"})
    }

    token = jwt.sign({ userId: user._id }, 
                    process.env.JWT_SECRET,
                    { expiresIn: "1h"})

    res.json({message: "User succcessfully logged in", userId: user._id, token: token})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
}

//forgotPassword - send email with password reset token
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; //1 hour for now

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    //note - add "FRONTEND_URL=http://localhost:5173" to /backend/.env
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: email,
      subject: "Studious Password Reset",
      text: `Click this link to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    })

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//resetPassword - reset user's password and save new password to database
exports.resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token
    });

    if (!user) return res.status(400).json({ message: "Invalid token" });
    if (user.resetPasswordExpires < Date.now()) return res.status(400).json({ message: "Expired token"});

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};