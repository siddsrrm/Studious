const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

//forgotPassword - send email with password reset token
exports.forgotPassword = async (req, res) => {
  
};

//resetPassword - reset user's password and save new password to database
exports.resetPassword = async (req, res) => {
  
};