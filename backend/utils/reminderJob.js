const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const sendEmail = require("./email");

async function sendReminders() {
    try {
        const users = await User.find({ "notificationSettings.remindersEnabled": true });

        for (const user of users) {
            const daysBefore = user.notificationSettings.reminderDaysBefore;

            const now = new Date();
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + daysBefore);

            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const tasks = await Task.find({
                ownerID: user._id,
                completed: false,
                dueDate: { $gte: startOfDay, $lte: endOfDay }
            });

            if (tasks.length === 0) continue;

            const taskList = tasks
                .map(t => `- ${t.title} (due: ${new Date(t.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' })})`)
                .join("\n");

            await sendEmail({
                to: user.email,
                subject: "Studious — Upcoming Task Reminders",
                text: `Hi ${user.username},\n\nYou have the following tasks due in ${daysBefore} day(s):\n\n${taskList}\n\nLog in to Studious to stay on track.`
            });
        }
    } catch (err) {
        console.error("Error sending reminders:", err.message);
    }
}

//run every day at 8am
function startReminderJob() {
    cron.schedule("0 8 * * *", () => {
        console.log("Running reminder job...");
        sendReminders();
    });
}

module.exports = { startReminderJob, sendReminders }