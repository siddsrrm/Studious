const Folder = require("../models/Folder")

// Get folders for a study plan
const getFolders = async (req, res) => {
  try {
    const { studyPlanId } = req.query;
    if (!studyPlanId) return res.status(400).json({ message: "studyPlanId is required" });

    const folders = await Folder.find({ ownerID: req.user.userId, studyPlanID: studyPlanId });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: "Error fetching folders", error: err.message });
  }
}

// Create a folder
const createFolder = async (req, res) => {
  try {
    const { studyPlanID, name } = req.body;
    if (!studyPlanID || !name) return res.status(400).json({ message: "studyPlanID and name are required" });

    const folder = await Folder.create({
      ownerID: req.user.userId,
      studyPlanID,
      name: name.trim(),
    });

    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: "Error creating folder", error: err.message });
  }
}

// Delete a folder
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (folder.ownerID.toString() !== req.user.userId) return res.status(403).json({ message: "Forbidden" });

    await Folder.deleteOne({ _id: folder._id });
    res.json({ message: "Folder deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting folder", error: err.message });
  }
}

module.exports = { getFolders, createFolder, deleteFolder }
