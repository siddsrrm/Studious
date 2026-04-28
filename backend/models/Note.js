const mongoose = require("mongoose")

const noteSchema = new mongoose.Schema({
  // attribute, type
  // userID can just be _id property of schema
  ownerID: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studyPlanID: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", default: null },
  folderId: { type: String, default: "__unfiled__" },
  title: { type: String, default: "Untitled" },
  content: String,
  tags: [String],
  attachments: [String],
  summary: String, // populated by AI service
  groupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup" }]
})

//updateNote - update certain fields of note
noteSchema.methods.updateNote = async function (updates) {
  const allowed = ['title', 'content', 'tags', 'folderId'];
  allowed.forEach(field => {
    if (updates[field] !== undefined) this[field] = updates[field];
  });
  await this.save();
  return this;
}

noteSchema.methods.addAttachment = function (attachment) {
  //logic tbd
}

noteSchema.methods.generateSummary = function (attachment) {
  //logic tbd
}


module.exports = mongoose.model("Note", noteSchema)