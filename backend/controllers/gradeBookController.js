const GradeBook = require("../models/GradeBook");

exports.getGradeBook = async (req, res) => {
    try {
        let gradeBook = await GradeBook.findOne({
            studyPlanID: req.params.studyPlanId,
            userID: req.user.userId,
        });

        if (!gradeBook) {
            gradeBook = await GradeBook.create({
                studyPlanID: req.params.studyPlanId,
                userID: req.user.userId,
                entries: [],
            });
        }

        return res.status(200).json({
            entries: gradeBook.entries,
            overallGrade: gradeBook.calculateOverallGrade(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to fetch grade book." });
    }
};

exports.addEntry = async (req, res) => {
    try {
        const { title, type, score, weight, dueDate, notes } = req.body;

        if (!title || !title.trim())
            return res.status(400).json({ message: "Title is required." });
        if (!["assignment", "project", "exam"].includes(type))
            return res.status(400).json({ message: "Type must be assignment, project, or exam." });
        if (score === undefined || score < 0 || score > 100)
            return res.status(400).json({ message: "Score must be between 0 and 100." });
        if (weight !== undefined && weight !== null && (weight < 0 || weight > 100))
            return res.status(400).json({ message: "Weight must be between 0 and 100." });

        let gradeBook = await GradeBook.findOne({
            studyPlanID: req.params.studyPlanId,
            userID: req.user.userId,
        });
        if (!gradeBook) {
            gradeBook = new GradeBook({
                studyPlanID: req.params.studyPlanId,
                userID: req.user.userId,
                entries: [],
            });
        }

        gradeBook.entries.push({ title: title.trim(), type, score, weight: weight ?? null, dueDate: dueDate || null, notes: notes || "" });
        await gradeBook.save();

        return res.status(201).json({
            entries: gradeBook.entries,
            overallGrade: gradeBook.calculateOverallGrade(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to add entry." });
    }
};

exports.updateEntry = async (req, res) => {
    try {
        const { title, type, score, weight, dueDate, notes } = req.body;

        if (score !== undefined && (score < 0 || score > 100))
            return res.status(400).json({ message: "Score must be between 0 and 100." });
        if (weight !== undefined && weight !== null && (weight < 0 || weight > 100))
            return res.status(400).json({ message: "Weight must be between 0 and 100." });
        if (type && !["assignment", "project", "exam"].includes(type))
            return res.status(400).json({ message: "Type must be assignment, project, or exam." });

        const gradeBook = await GradeBook.findOne({
            studyPlanID: req.params.studyPlanId,
            userID: req.user.userId,
        });
        if (!gradeBook) return res.status(404).json({ message: "Grade book not found." });

        const entry = gradeBook.entries.id(req.params.entryId);
        if (!entry) return res.status(404).json({ message: "Entry not found." });

        if (title !== undefined) entry.title = title.trim();
        if (type !== undefined) entry.type = type;
        if (score !== undefined) entry.score = score;
        if (weight !== undefined) entry.weight = weight ?? null;
        if (dueDate !== undefined) entry.dueDate = dueDate || null;
        if (notes !== undefined) entry.notes = notes;

        await gradeBook.save();

        return res.status(200).json({
            entries: gradeBook.entries,
            overallGrade: gradeBook.calculateOverallGrade(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update entry." });
    }
};

exports.deleteEntry = async (req, res) => {
    try {
        const gradeBook = await GradeBook.findOne({
            studyPlanID: req.params.studyPlanId,
            userID: req.user.userId,
        });
        if (!gradeBook) return res.status(404).json({ message: "Grade book not found." });

        const entry = gradeBook.entries.id(req.params.entryId);
        if (!entry) return res.status(404).json({ message: "Entry not found." });

        gradeBook.entries.pull({ _id: req.params.entryId });
        await gradeBook.save();

        return res.status(200).json({
            entries: gradeBook.entries,
            overallGrade: gradeBook.calculateOverallGrade(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to delete entry." });
    }
};