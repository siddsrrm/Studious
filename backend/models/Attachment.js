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

  type: {
    type: String,
    enum: ["file", "link"],
    required: true,
  },

  // link-specific

  url: {
    type: String,
    required: function () {
      return this.type === "link";
    },
  },

  // file-specific

  filename: {
    type: String,
    required: function () {
      return this.type === "file";
    },
  },

  fileUrl: {
    type: String,
    required: function () {
      return this.type === "file";
    },
  },

  size: {
    type: Number, // bytes
    required: function () {
      return this.type === "file";
    },
  },

  mimeType: {
    type: String,
    required: function () {
      return this.type === "file";
    },
  },
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
