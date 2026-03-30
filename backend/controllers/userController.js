const User = require("../models/User");
const StudyPlan = require("../models/StudyPlan");
const bcrypt = require("bcryptjs");


exports.updateProfile = async (req, res) => {

  const { avatar } = req.body;

  try {

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({message : "user not found"});
      }
      user.avatar = avatar;

      await user.updateOne(avatar);
    res.json({ message: "Profile updated.", avatar: user.avatar });
  } catch (err) {
    res.status(500).json({message : "failed to update profile photo"});
  }

}


exports.getInfo = async (req, res) => {

  
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) { 
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user info" });
  }
}

exports.nameChange = async (req, res) => {
  const newName = req.body.name;

  // get the user from the db
  const user = await User.findById(req.user.userId);

  //User is verified to be the owner via jwt token

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

  // get the user from the db
  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  //do not need to verify password, token verifies for us


  // Delete all study plans belonging to the user
    await StudyPlan.deleteMany({ owner: req.user.userId });

  //delete user data from db
  await User.deleteOne({ _id: user._id });

  //return success
  res.json({ message: "Account deleted successfully" });
};

//email change
exports.emailChange = async (req, res) => {
  try {
    //save new email
    const newEmail = req.body.email;

    //find user by id
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newEmail === user.email) {
      return res.status(400).json({ message: "New email is the same as the current email" });
    }

    //verify email is available
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    //update email
    user.email = newEmail;
    await user.updateOne({ email: newEmail });
    res.json({ message: "Email updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update email" });
  }
}

//toggle 2FA
exports.toggle2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();
    res.json({
      message: `2FA ${user.twoFactorEnabled ? "enabled" : "disabled"}`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update 2FA setting" });
  }
}

exports.getNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("notificationSettings");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.notificationSettings);
    } catch (err) {
        res.status(500).json({ message: "Error fetching settings", error: err.message });
    }
};

exports.updateNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        const { remindersEnabled, reminderDaysBefore } = req.body;
        if (remindersEnabled !== undefined) user.notificationSettings.remindersEnabled = remindersEnabled;
        if (reminderDaysBefore !== undefined) user.notificationSettings.reminderDaysBefore = reminderDaysBefore;
        await user.save();
        res.json(user.notificationSettings);
    } catch (err) {
        res.status(500).json({ message: "Error updating settings", error: err.message });
    }
};