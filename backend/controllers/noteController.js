const Note = require("../models/Note")

const searchNotes = async (req, res) => {
  try {
    const { tag } = req.query;
    if (!tag) return res.status(400).json({ message: "No tag provided" });

    const notes = await Note.find({
      ownerID: req.user.userId,
      tags: { $in: [tag] }
    });

    res.json(notes ?? []);
  } catch (err) {
    res.status(500).json({ message: "Error searching notes", error: err.message });
  }
}

module.exports = { searchNotes }