const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const sendEmail = require("./email");

//helper to format tasks by study plan for email body
function formatTasksByStudyPlan(tasks, isOverdue) {
    //group tasks by study plan title
    const groups = {};
    for (const task of tasks) {
        const planTitle = task.studyPlanID?.title || "No Study Plan";
        if (!groups[planTitle]) groups[planTitle] = [];
        groups[planTitle].push(task);
    }

    let output = "";
    for (const [planTitle, planTasks] of Object.entries(groups)) {
        output += `  ${planTitle}:\n`;
        for (const task of planTasks) {
            const dateLabel = isOverdue ? "was due" : "due";
            const date = new Date(task.dueDate).toLocaleDateString('en-US', { timeZone: 'UTC' });
            output += `    - ${task.title} (${dateLabel}: ${date})\n`;
        }
    }
    return output;
}

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

            const upcomingTasks = await Task.find({
                ownerID: user._id,
                completed: false,
                dueDate: { $gte: startOfToday, $lte: endOfWindow }
            }).populate("studyPlanID", "title");

            const overdueTasks = await Task.find({
                ownerID: user._id,
                completed: false,
                dueDate: { $lt: startOfToday }
            }).populate("studyPlanID", "title");

            if (upcomingTasks.length === 0 && overdueTasks.length === 0) continue;

            let emailBody = `Hi ${user.username},\n\nBelow is a summary of your tasks that are either overdue or due within the next ${daysBefore} day(s):\n\n`;

            if (overdueTasks.length > 0) {
                emailBody += `OVERDUE TASKS:\n`;
                emailBody += formatTasksByStudyPlan(overdueTasks, true);
                emailBody += "\n";
            }

            if (upcomingTasks.length > 0) {
                emailBody += `UPCOMING TASKS (due within ${daysBefore} day(s)):\n`;
                emailBody += formatTasksByStudyPlan(upcomingTasks, false);
                emailBody += "\n";
            }

            emailBody += `Log in to Studious to complete them and stay on track.\nTo update your notification preferences, visit your account settings.\n\nBest,\nThe Studious Team`;

            await sendEmail({
                to: user.email,
                subject: "Studious - Task Reminders",
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