const mongoose = require("mongoose")

const AIServiceSchema = new mongoose.Schema({
  // attribute, type
  // serviceID can just be _id property of schema
  apiEndpoint: String,
  isAvailable: Boolean
})

AIServiceSchema.methods.generateTaskBreakdown = function(taskData) {
  // logic here
}

AIServiceSchema.methods.summarizeNote = function(content) {

}

AIServiceSchema.methods.generatePracticeQuestions = function(noteData) {

}

AIServiceSchema.methods.validateOutput = function(outputData) {

}

module.exports = mongoose.model("AIService", AIServiceSchema)