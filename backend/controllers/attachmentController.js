const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const Attachment = require("../models/Attachment");

// Helper to safely get user ID
const getUserId = (req) => {
  return req.user?.userId;
};

exports.getAttachments = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { taskId } = req.query;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    const attachments = await Attachment.find({
      ownerID: userId,
      taskId: taskId,
    });

    res.json(attachments);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching attachments",
      error: err.message,
    });
  }
};

exports.createAttachment = async (req, res) => {
  let fileName;
  let filePath;

  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { taskId, type, url, fileUrl, filename, size, mimeType } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    if (!type) {
      return res.status(400).json({ message: "type is required" });
    }

    const validTypes = ["link", "file"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid attachment type" });
    }

    const data = {
      ownerID: userId,
      taskId,
      type,
    };

    if (type === "link") {
      if (!url) {
        return res.status(400).json({
          message: 'URL required for attachment type "link"',
        });
      }

      try {
        new URL(url);
        data.url = url;
      } catch {
        return res.status(400).json({
          message: 'Invalid URL format for attachment type "link"',
        });
      }

      data.url = url;
    }

    if (type === "file") {
      const uploadedFile = req.file;

      const finalFileUrl = fileUrl || uploadedFile?.path;
      const finalFilename = filename || uploadedFile?.originalname;
      const finalSize = size || uploadedFile?.size;
      const finalMimeType = mimeType || uploadedFile?.mimetype;

      if (!finalFileUrl || !finalFilename) {
        return res.status(400).json({
          message: "fileUrl and filename are required",
        });
      }

      data.fileUrl = finalFileUrl;
      data.filename = finalFilename;
      data.size = finalSize;
      data.mimeType = finalMimeType;
    }

    const attachment = await Attachment.create(data);
    res.status(201).json(attachment);
  } catch (err) {
    try {
      if (filePath) await fsp.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("[createAttachment] cleanup error:", err);
      }
    }
    res.status(500).json({
      message: "Error creating attachment",
      error: err.message,
    });
  }
};

exports.updateAttachment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (attachment.ownerID.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (req.body.type === "file") {
      const { fileUrl, filename, size, mimeType } = req.body;

      if (!fileUrl || !filename || !size || !mimeType) {
        return res.status(400).json({ message: "Incomplete file data" });
      }
    }

    // Old file info
    const oldFileUrl = attachment.fileUrl;
    const oldType = attachment.type;

    const updated = await attachment.updateAttachment(req.body);

    // Cleanup old file if either:
    // - type changed to link, or
    // - fileUrl changed (new file)
    if (
      oldType === "file" &&
      oldFileUrl &&
      (updated.type !== "file" || updated.fileUrl !== oldFileUrl)
    ) {
      try {
        const fileName = path.basename(oldFileUrl);
        const filePath = path.join(__dirname, "../data/assets", fileName);

        if (fs.existsSync(filePath)) {
          await fsp.unlink(filePath);
          console.log("[updateAttachment] Old file deleted:", filePath);
        }
      } catch (err) {
        console.error("[updateAttachment] Cleanup error:", err);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Error updating attachment",
      error: err.message,
    });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (attachment.ownerID.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // DELETE FILE FROM DISK (only if it's a file)
    if (attachment.type === "file" && attachment.fileUrl) {
      try {
        const fileName = path.basename(attachment.fileUrl);
        const filePath = path.join(__dirname, "../data/assets", fileName);

        if (fs.existsSync(filePath)) {
          await fsp.unlink(filePath);
          console.log("[deleteAttachment] File deleted:", filePath);
        } else {
          console.warn("[deleteAttachment] File not found on disk:", filePath);
        }
      } catch (fileErr) {
        console.error("[deleteAttachment] File deletion error:", fileErr);
      }
    }

    // DELETE DB RECORD
    await Attachment.deleteOne({ _id: req.params.id });

    res.json({ message: "Attachment deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting attachment",
      error: err.message,
    });
  }
};
