const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  ownerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  recurrence: {
    freq: {
      type: String,
      enum: ["daily", "weekly", "monthly", null],
      default: null,
    },
    interval: {
      type: Number,
      default: 1,
    },
    byweekday: {
      type: [String], // ['mo', 'we']
      default: [],
    },
    until: Date,
    count: Number,
  },
});

module.exports = mongoose.model("Event", EventSchema);
