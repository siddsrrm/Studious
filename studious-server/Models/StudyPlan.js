const mongoose = require("mongoose")

const StudyPlanSchema = new mongoose.Schema({
  // attribute, type
  // studyplanID can just be _id property of schema
  title: String,
  description: String,
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  to_do_list: { type: mongoose.Schema.Types.ObjectId, ref: "ToDoList" },
  praticeQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "PracticeQuestion" }]
})

StudyPlanSchema.methods.addNote = function(noteData) {
  // logic here
}

StudyPlanSchema.methods.addTask = function(taskData) {

}

StudyPlanSchema.methods.removeTask = function(taskID) {

}

StudyPlanSchema.methods.addPraticeQuestion = function(questionData) {

}

module.exports = mongoose.model("StudyPlan", StudyPlanSchema)