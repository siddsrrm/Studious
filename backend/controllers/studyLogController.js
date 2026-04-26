const StudyLog = require("../models/StudyLog");

const updateLogs = async (req, res) => {
    try {
        const { planId, planTitle, date, durationMins } = req.body;
    const userId = req.user.userId; 

    if (!planId || !durationMins) {
      return res.status(400).json({ message: "planId and durationMins are required." });
    }

    const log = await StudyLog.create({
      user: userId,
      planId,
      planTitle,
      date: date || new Date(),
      durationMins,
    });

    res.status(201).json({ message: "Log saved.", log });
    } catch (err) {
        console.log(err);
        res.status(500).json({message: "server error"});
    }
}
const getLogs = async (req, res) => {
   try {
    const userId = req.user.userId;

    const logs = await StudyLog.find({ user: userId })
      .sort({ date: -1 }); // most recent first

    res.status(200).json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
}

module.exports = {updateLogs, getLogs};