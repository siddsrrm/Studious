const mongoose = require("mongoose")
const StudyPlan = require("./models/StudyPlan")

const noteSchema = new mongoose.Schema({
  // attribute, type
  // userID can just be _id property of schema
  ownerID: {type:mongoose.Schema.Types.ObjectId, ref:"User", required: true},
  studyPlanID: {type: mongoose.Schema.Types.ObjectId, ref:"StudyPlan", required: true},
  title: {type: String, required: true},
  content: String,
  tags: [String],
  attachments: [String],
  summary: String // populated by AI service
})

noteSchema.methods.updateContent = function(newContent) {
  // logic here
}

noteSchema.methods.addTag = function(tag) {
  
}

noteSchema.methods.addAttachment = function(attachment) {

}

noteSchema.methods.generateSummary = function(attachment) {

}


module.exports = mongoose.model("Note", noteSchema)