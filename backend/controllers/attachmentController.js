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
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { taskId, type, url, filename, fileUrl, size, mimeType } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required" });
    }

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
    }

    if (type === "file") {
      if (!filename) {
        return res.status(400).json({
          message: 'filename required for attachment type "file"',
        });
      }

      if (!fileUrl) {
        return res.status(400).json({
          message: 'fileUrl required for attachment type "file"',
        });
      }

      if (size === undefined) {
        return res.status(400).json({
          message: 'size required for attachment type "file"',
        });
      }

      if (!mimeType) {
        return res.status(400).json({
          message: 'mimeType required for attachment type "file"',
        });
      }

      if (fileUrl.startsWith("http")) {
        try {
          new URL(fileUrl);
        } catch {
          return res.status(400).json({
            message: 'Invalid URL format for attachment type "file"',
          });
        }
      }
    }

    const data = {
      ownerID: userId,
      taskId,
      type,
    };

    if (type === "link") {
      data.url = url;
    } else {
      data.filename = filename;
      data.fileUrl = fileUrl;
      data.size = size;
      data.mimeType = mimeType;
    }

    const attachment = await Attachment.create(data);

    res.status(201).json(attachment);
  } catch (err) {
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

    const updated = await attachment.updateAttachment(req.body);

    res.json(updated);
  } catch (err) {
    res.status(500).json({
      message: "Error updating attachment",
      error: err.message,
    });
  }
};

const path = require("path");
const fs = require("fs");

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
          fs.unlinkSync(filePath);
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
