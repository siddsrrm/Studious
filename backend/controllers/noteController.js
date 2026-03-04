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

// Get all notes for a study plan
const getNotes = async (req, res) => {
  try {
    const { studyPlanId } = req.query;
    if (!studyPlanId) return res.status(400).json({ message: "studyPlanId is required" });

    const notes = await Note.find({ ownerID: req.user.userId, studyPlanID: studyPlanId });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error fetching notes", error: err.message });
  }
}

// Create a new note
const createNote = async (req, res) => {
  try {
    const { studyPlanID, title, content, tags, folderId } = req.body;
    if (!studyPlanID) return res.status(400).json({ message: "studyPlanID is required" });

    const note = await Note.create({
      ownerID: req.user.userId,
      studyPlanID,
      title: title || "Untitled",
      content: content || "",
      tags: tags || [],
      folderId: folderId || "__unfiled__",
    });

    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: "Error creating note", error: err.message });
  }
}

// Update a note
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });

    const { title, content, tags, folderId } = req.body;
    if (title !== undefined) note.title = title || "Untitled";
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (folderId !== undefined) note.folderId = folderId;

    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: "Error updating note", error: err.message });
  }
}

// Delete a note
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    if (note.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });

    await Note.deleteOne({ _id: note._id });
    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting note", error: err.message });
  }
}

module.exports = { searchNotes, getNotes, createNote, updateNote, deleteNote }