const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const sendEmail = require("./email");

//sendReminders - find all tasks due within next X days for users with reminders enabled, send email summary of upcoming and overdue tasks
async function sendReminders() {
    try {
        const users = await User.find({ "notificationSettings.remindersEnabled": true });

        for (const user of users) {
            const daysBefore = user.notificationSettings.reminderDaysBefore;

            const now = new Date();
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + daysBefore);

            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const endOfWindow = new Date();
            endOfWindow.setDate(endOfWindow.getDate() + daysBefore);
            endOfWindow.setHours(23, 59, 59, 999);
            console.log("Checking tasks for user:", user._id, "window:", startOfToday, "to", endOfWindow);

            const upcomingTasks = await Task.find({
                ownerID: user._id,
                completed: false,
                dueDate: { $gte: startOfToday, $lte: endOfWindow }
            });
            //test
            console.log(upcomingTasks);

            const overdueTasks = await Task.find({
                ownerID: user._id,
                completed: false,
                dueDate: { $lt: startOfToday }
            });
            console.log(overdueTasks);

            if (upcomingTasks.length === 0 && overdueTasks.length === 0) continue;

            let emailBody = `Hi ${user.username},\n\nBelow is a summary of your tasks that are either overdue or due within the next ${daysBefore} day(s):\n\n`;

            if (overdueTasks.length > 0) {
                const overdueList = overdueTasks
                    .map(t => `- ${t.title} (was due: ${new Date(t.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' })})`)
                    .join("\n");
                emailBody += `OVERDUE TASKS:\n${overdueList}\n\n`;
            }

            if (upcomingTasks.length > 0) {
                const upcomingList = upcomingTasks
                    .map(t => `- ${t.title} (due: ${new Date(t.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' })})`)
                    .join("\n");
                emailBody += `UPCOMING TASKS (due within ${daysBefore} day(s)):\n${upcomingList}\n\n`;
            }

            emailBody += `Log in to Studious to complete them and stay on track.\nTo update your notification preferences, visit your account settings.\n\nBest,\nThe Studious Team`;

            await sendEmail({
                to: user.email,
                subject: "Studious — Task Reminders",
                text: emailBody
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