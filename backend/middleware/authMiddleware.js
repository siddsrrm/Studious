const jwt = require("jsonwebtoken")
require("dotenv").config()

const authToken = (req, res, next) => {
  const header = req.headers.authorization

  const token = header && header.split(" ")[1]
  if (!token) {
    return res.status(401).json({message: "Unauthorized"})
  }

  try {
    // sets the user of the request to the user from the token
    req.user = jwt.verify(token, process.env.JWT_SECRET)

    // tells express to move to the next function
    next()
  } catch {
    res.status(403).json({message: "Invalid token"})
  }
}

module.exports = authToken