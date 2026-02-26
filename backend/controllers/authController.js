const User = require("../models/User")
const bcrypt = require("bcryptjs")

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
    const { username, password } = req.body

    // find user
    const user = await User.findOne({username})
    if (!user) {
      return res.status(404).json({message: "User not found"})
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({message: "Invalid credentials"})
    }

    res.json({message: "User succcessfully logged in", userId: user._id})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
}