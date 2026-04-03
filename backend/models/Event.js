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
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  googleEventId: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("Event", EventSchema);