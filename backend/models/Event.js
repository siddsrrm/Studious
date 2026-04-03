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
  rrule: {
    type: Object,
    default: null,
  },
  duration: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Event", EventSchema);
