const mongoose = require("mongoose")

const studyGroupSchema = new mongoose.Schema({
  // attribute, type
  // userID can just be _id property of schema

  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // array of users
  createdAt: { type: Date, default: Date.now }

  // messages and notes will reference this group via groupId
})

module.exports = mongoose.model("StudyGroup", studyGroupSchema)
