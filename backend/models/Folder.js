const mongoose = require("mongoose")

const folderSchema = new mongoose.Schema({
  ownerID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studyPlanID: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true },
  name: { type: String, required: true },
})

module.exports = mongoose.model("Folder", folderSchema)
