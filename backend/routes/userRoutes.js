const express = require("express")
const router = express.Router()
const {updateProfile, nameChange, deleteAccount, emailChange, toggle2FA, getNotificationSettings, updateNotificationSettings, getInfo } = require("../controllers/userController")
const User = require("../models/User")
const authToken = require("../middleware/authMiddleware")

router.post("/nameChange", authToken, nameChange)
router.post("/delete", authToken, deleteAccount)
router.post("/emailChange", authToken, emailChange)
router.post("/toggle2FA", authToken, toggle2FA);
router.get("/notification-settings", authToken, getNotificationSettings);
router.put("/notification-settings", authToken, updateNotificationSettings);
router.post("/updateProfile", authToken, updateProfile)
router.get("/me", authToken, getInfo);
router.post("/google/disconnect", authToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, {
      googleCalendarConnected: false,
      googleAccessToken: null,
      googleRefreshToken: null,
    });
    res.json({ message: "Google Calendar disconnected" });
  } catch (err) {
    res.status(500).json({ message: "Failed to disconnect" });
  }
});

module.exports = router