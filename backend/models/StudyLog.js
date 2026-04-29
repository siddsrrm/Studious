const mongoose = require("mongoose");

const studyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyPlan",
    required: true,
  },
  planTitle: String, 

  date: {
    type: Date,
    default: Date.now,
  },

  durationMins: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("StudyLog", studyLogSchema);