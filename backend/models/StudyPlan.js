
const mongoose = require("mongoose")


const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  startDate: Date, 
  endDate: Date, 
  reminderTime: Date, 
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  dueDate: Date
});

const studyPlanSchema = new mongoose.Schema({
  // attribute, type
  // studyplanID can just be _id property of schema
  owner : { type: mongoose.Schema.Types.ObjectId, ref: "User"},
  title: {type: String, required: true},
  description: String,
  to_do_list: [taskSchema],
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }], 
  practiceQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: "PracticeQuestion" }]
})

studyPlanSchema.methods.addNote = function(noteData) {
  // logic here
}

studyPlanSchema.methods.addTask = function(taskData) {

}

studyPlanSchema.methods.removeTask = function(taskID) {

}

studyPlanSchema.methods.addPracticeQuestion = function(questionData) {

}

module.exports = mongoose.model("StudyPlan", studyPlanSchema)
