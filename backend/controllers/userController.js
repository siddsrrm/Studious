const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.nameChange = async (req, res) => {
  const { userID, newName } = req.body;

  // get the user from the db
  const user = await User.findOne({ userID: userID });

  //TODO: Verify user is owner of account

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  //see if new name is available
  const existingUser = await User.findOne({ username: newName });

  if (existingUser) {
    return res.status(400).json({ message: "Username already taken" });
  }

  //new name available, change the db
  user.username = newName;
  await user.updateOne({ username: newName });

  //return success
  res.json({ message: "Name updated successfully" });
};

exports.deleteAccount = async (req, res) => {
  const { userID, password } = req.body;

  // get the user from the db
  const user = await User.findOne({ userID: userID });

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
};