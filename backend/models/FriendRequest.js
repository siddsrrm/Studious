const mongoose = require("mongoose")

const friendRequestSchema = new mongoose.Schema({
  // attribute, type
  // userID can just be _id property of schema
  sender: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  recipient: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  status: {type: Number, required: true}
})

module.exports = mongoose.model("FriendRequest", friendRequestSchema)