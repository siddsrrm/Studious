const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
  ownerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },

  type: "file" | "link",

  // link-specific
  url: { type: String, required: true },

  // file-specific
  filename: {},
  fileUrl: {},
  size: {},
  mimeType: {},
});

AttachmentSchema.methods.updateAttachment = async function (updates) {
  const allowed = ["type", "url", "filename", "fileUrl", "size", "mimeType"];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) this[field] = updates[field];
  });
  await this.save();
  return this;
};

module.exports = mongoose.model("Attachment", AttachmentSchema);
