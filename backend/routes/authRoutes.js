const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verify2FA } = require("../controllers/authController");
const passport = require("passport");
const jwt = require("jsonwebtoken");
require("../config/passport");

router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-2fa", verify2FA);

// Redirect to Google
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

// Google callback
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    // Redirect to frontend with token in query string
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

module.exports = router;