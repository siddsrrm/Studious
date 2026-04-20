const path = require("path");
const fs = require("fs/promises");
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

    const { taskId, type, url } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

    let data = {
      ownerID: userId,
      taskId,
      type,
    };

    const validTypes = ["link", "file"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid attachment type" });
    }

    if (type === "link") {
      if (!url) {
        return res.status(400).json({
          message: 'URL required for attachment type "link"',
        });
      }

      try {
        new URL(url);
      } catch {
        return res.status(400).json({
          message: 'Invalid URL format for attachment type "link"',
        });
      }

      data.url = url;
    }

    if (type === "file") {
      if (!req.file) {
        return res.status(400).json({
          message: "File is required",
        });
      }

      // Duplicate check
      const existing = await Attachment.findOne({
        ownerID: userId,
        taskId,
        type: "file",
        filename: req.file.originalname,
        size: req.file.size,
      });

      if (existing) {
        return res.status(400).json({
          message: "This file already exists for this task",
        });
      }

      fileName = `${Date.now()}-${req.file.originalname}`;
      filePath = path.join(__dirname, "../uploads", fileName);

      await fs.writeFile(filePath, req.file.buffer);

      data.filename = req.file.originalname;
      data.fileUrl = `${req.protocol}://${req.get("host")}/uploads/${fileName}`;
      data.size = req.file.size;
      data.mimeType = req.file.mimetype;
    }

    const attachment = await Attachment.create(data);
    res.status(201).json(attachment);
  } catch (err) {
    try {
      await fs.unlink(filePath);
      console.log("[deleteAttachment] File deleted:", filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error("[deleteAttachment] File deletion error:", err);
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
        const filePath = path.join(__dirname, "../uploads", fileName);

        if (fs.existsSync(filePath)) {
          await fs.unlink(filePath);
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
        const filePath = path.join(__dirname, "../uploads", fileName);

        if (fs.existsSync(filePath)) {
          await fs.unlink(filePath);
          console.log("[deleteAttachment] File deleted:", filePath);
        } else {
          console.warn("[deleteAttachment] File not found on disk:", filePath);
        }
      } catch (fileErr) {
        console.error("[deleteAttachment] File deletion error:", fileErr);
      }
    }

    // DELETE DB RECORD
    await attachment.deleteOne();

    res.json({ message: "Attachment deleted" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting attachment",
      error: err.message,
    });
  }
};
