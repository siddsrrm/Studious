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
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(409).json({ message: "Email already in use" })
    }

    const existingUsername = await User.findOne({ username })
    if (existingUsername) {
      return res.status(409).json({ message: "Username already in use" })
    }

    // encrypt password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await User.create({ username, email, password: hashedPassword})
    res.json({message: "User successfully created", userId: newUser._id})
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body

    // find user either by email or username
    const user = await User.findOne(email ? { email } : { username })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" })
    }
    
    //2FA
    if (user.twoFactorEnabled) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      user.twoFactorCode = await bcrypt.hash(code, 10)
      user.twoFactorExpires = Date.now() + 10 * 60 * 1000 //10 minutes
      await user.save()

      await sendEmail({
        to: user.email,
        subject: "Studious Login Verification",
        text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      })

      const pendingToken = jwt.sign(
        { userId: user._id, stage: "2fa-pending" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      )
      return res.status(200).json({ requiresTwoFactor: true, pendingToken })
    }

    token = jwt.sign({ userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" })

    res.json({message: "User successfully logged in", userId: user._id, token: token, username: user.username})
  } catch (error) {
    res.status(500).json({ error: error.message })
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
    if (user.resetPasswordExpires < Date.now()) return res.status(400).json({ message: "Expired token" });

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

//verify2FA - verify JWT for 2fa pending, send email containing 6 character token
exports.verify2FA = async (req, res) => {
  try {
    const { code, pendingToken } = req.body
    if (!code || !pendingToken) {
      return res.status(400).json({ message: "Code and session token are required" })
    }

    //verify JWT
    let payload
    try {
      payload = jwt.verify(pendingToken, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." })
    }

    if (payload.stage !== "2fa-pending") {
      return res.status(401).json({ message: "Invalid token stage" })
    }

    const user = await User.findById(payload.userId)
    if (!user || !user.twoFactorCode) {
      return res.status(400).json({ message: "No pending 2FA found. Please log in again." })
    }

    if (user.twoFactorExpires < Date.now()) {
      user.twoFactorCode = undefined
      user.twoFactorExpires = undefined
      await user.save()
      return res.status(400).json({ message: "Code has expired. Please log in again." })
    }

    //validate code
    const isValid = await bcrypt.compare(code, user.twoFactorCode)
    if (!isValid) {
      return res.status(400).json({ message: "Invalid code. Please try again." })
    }

    user.twoFactorCode = undefined
    user.twoFactorExpires = undefined
    await user.save()

    //issue session token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )
    res.status(200).json({ message: "Verification successful", userId: user._id, token, username: user.username, twoFactorEnabled: user.twoFactorEnabled })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
};