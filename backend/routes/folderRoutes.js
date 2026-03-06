const express = require("express")
const router = express.Router()
const authToken = require("../middleware/authMiddleware")
const { getFolders, createFolder, deleteFolder } = require("../controllers/folderController")

router.get("/", authToken, getFolders)
router.post("/", authToken, createFolder)
router.delete("/:id", authToken, deleteFolder)

module.exports = router
