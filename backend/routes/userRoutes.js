const express = require("express")
const router = express.Router()
const { nameChange, deleteAccount } = require("../controllers/userController")

router.post("/nameChange", nameChange)
router.post("/delete", deleteAccount)

module.exports = router