const User = require("../models/User");
const StudyPlan = require("../models/StudyPlan");
const FriendRequest = require("../models/FriendRequest");
const ProgressTracker = require("../models/ProgressTracker");
const { emitToUser } = require("../socket");
const { emitToAll } = require("../socket");
const bcrypt = require("bcryptjs");


exports.updateProfile = async (req, res) => {
  const { avatar, displayName, bio, location } = req.body;  // add the 3 new fields

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (bio !== undefined && bio.length > 200) {
  return res.status(400).json({ message: "Bio cannot exceed 200 characters." });
}

    // Build update object with only provided fields
    const updates = {};
    if (avatar !== undefined)     { updates.avatar = avatar; user.avatar = avatar; }
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined)         updates.bio = bio;
    if (location !== undefined)    updates.location = location;

    await user.updateOne(updates);

    emitToAll("user_profile_updated", {
      userId: user._id.toString(),
      username: user.username,
      avatar: avatar ?? user.avatar
    }, `${user.username} updated profile`);

    res.json({ message: "Profile updated.", ...updates });
  } catch (err) {
    res.status(500).json({ message: "failed to update profile" });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility } = req.body;
    const validOptions = ["public", "friends", "hidden"];
    if (!validOptions.includes(profileVisibility)) {
      return res.status(400).json({ message: "Invalid visibility option." });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.updateOne({ profileVisibility });
    res.json({ message: "Privacy settings updated.", profileVisibility });
  } catch (err) {
    res.status(500).json({ message: "Failed to update privacy settings." });
  }
};


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
  emitToAll("user_profile_updated", { userId: user._id.toString(), username: user.username, avatar: user.avatar }, `${user.username} updated username`)

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

  // Notify current friends in real time before removing relationships
  const acceptedFriendships = await FriendRequest.find({
    $or: [{ sender: req.user.userId }, { recipient: req.user.userId }],
    status: 1
  });

  acceptedFriendships.forEach((request) => {
    const isSender = request.sender.toString() === req.user.userId;
    const otherUserId = isSender ? request.recipient.toString() : request.sender.toString();
    emitToUser(
      otherUserId,
      "unfriended",
      { requestId: request._id.toString(), actorName: user.username },
      `${user.username} deleted their account`
    );
  });

  // Delete any friend relationships/requests involving this user
  await FriendRequest.deleteMany({
    $or: [{ sender: req.user.userId }, { recipient: req.user.userId }]
  });

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
        const { remindersEnabled, reminderDaysBefore, analyticsReportEnabled, analyticsReportDay } = req.body;
        if (remindersEnabled !== undefined) user.notificationSettings.remindersEnabled = remindersEnabled;
        if (reminderDaysBefore !== undefined) user.notificationSettings.reminderDaysBefore = reminderDaysBefore;
        if (analyticsReportEnabled !== undefined) user.notificationSettings.analyticsReportEnabled = analyticsReportEnabled;
        if (analyticsReportDay !== undefined) user.notificationSettings.analyticsReportDay = analyticsReportDay;
        await user.save();
        res.json(user.notificationSettings);
    } catch (err) {
        res.status(500).json({ message: "Error updating settings", error: err.message });
    }
};

exports.searchUsers = async (req, res) => {
  const { q } = req.query

  if (!q) {
    return res.json([])
  }

  try {
     // Get the searcher's friend list
    const friendships = await FriendRequest.find({
      $or: [{ sender: req.user.userId }, { recipient: req.user.userId }],
      status: 1
    });
    const friendIds = friendships.map(f =>
      f.sender.toString() === req.user.userId ? f.recipient.toString() : f.sender.toString()
    );

    const users = await User.find({
      username: { $regex: q, $options: "i" },
      _id: { $ne: req.user.userId },
      $or: [
        { profileVisibility: "public" },
        { profileVisibility: { $exists: false } }, //include people with no profileVisibility saved yet
        { profileVisibility: "friends", _id: { $in: friendIds } }
        // hidden users are excluded entirely
      ]
    }).select("username avatar").limit(20);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to search users" })
  }
}

exports.getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params
    // Support test mocks that either return a query-like object (with .select)
    // or return a Promise that resolves directly to the user object.
    let maybeQuery = User.findById(userId);
    let user;
    if (maybeQuery && typeof maybeQuery.select === "function") {
      user = await maybeQuery.select("username avatar displayName bio location");
    } else {
      user = await maybeQuery;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const tracker = await ProgressTracker.findOne({ userID: user._id }).select(
      "overallcompletion totalTasksFinished totalTasks"
    )

    res.json({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      displayName: user.displayName,   
  bio: user.bio,              
  location: user.location,         
      progress: {
        score: tracker?.overallcompletion ?? 0,
        totalTasksFinished: tracker?.totalTasksFinished ?? 0,
        totalTasks: tracker?.totalTasks ?? 0,
      },
    })
  } catch (err) {
  console.error(err);
  res.status(500).json({ message: "Failed to fetch user profile" })
  }
}