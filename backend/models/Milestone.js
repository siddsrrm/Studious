const mongoose = require("mongoose")

const milestoneSchema = new mongoose.Schema( {
  title: { type: String, required: true },
  targetPercent: { type: Number, required: true }, // 0–100
  completed: { type: Boolean, default: false },

});

module.exports = milestoneSchema;