const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verify2FA } = require("../controllers/authController");

router.post("/register", register)
router.post("/login", login)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-2fa", verify2FA);

module.exports = router;