const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword, verify2FA } = require("../controllers/authController");

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.post("/verify-2fa", verify2FA);

module.exports = router;