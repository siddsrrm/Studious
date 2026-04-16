const updateLogs = async (req, res) => {console.log("update logs");
    res.status(200).json({ message: "ok" });
}
const getLogs = async (req, res) => {console.log("get logs");
    res.status(200).json({ message: "ok" });
}

module.exports = {updateLogs, getLogs};