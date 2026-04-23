const cron = require("node-cron");
const Task = require("../models/Task");
const User = require("../models/User");
const StudyLog = require("../models/StudyLog");
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


const formatHours = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};


async function sendAnalyticsReport() {
    try {
        const users = await User.find({ "notificationSettings.analyticsReportEnabled": true });
        

        for (const user of users) {
            const now = new Date();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            const logs = await StudyLog.find({
    user: user._id,
    date: { $gte: monday, $lte: sunday }
});

            if (logs.length === 0) continue;

            const totalMins = logs.reduce((s, l) => s + l.durationMins, 0);
            const sessionsCount = logs.length;
            const avgSession = Math.round(totalMins / sessionsCount);

            // Per-course breakdown
            const courseMap = {};
            for (const log of logs) {
                const title = log.planTitle || "Unknown"; // remove log.planId?.title
                if (!courseMap[title]) courseMap[title] = 0;
                courseMap[title] += log.durationMins;
            }
            const topCourse = Object.entries(courseMap).sort((a, b) => b[1] - a[1])[0];

            // Daily breakdown
            const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const dailyLines = DAYS.map((day, i) => {
                const dayDate = new Date(monday);
                dayDate.setDate(monday.getDate() + i);
                const mins = logs
                    .filter(l => new Date(l.date).toDateString() === dayDate.toDateString())
                    .reduce((s, l) => s + l.durationMins, 0);
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                const formatted = h > 0 ? `${h}h ${m}m` : mins > 0 ? `${m}m` : "-";
                return `    ${day}: ${formatted}`;
            }).join("\n");

            let emailBody = `Hi ${user.username},\n\nHere's your weekly Studious study report:\n\n`;
            emailBody += `SUMMARY\n`;
            emailBody += `  Total study time: ${formatHours(totalMins)}\n`;
            emailBody += `  Sessions completed: ${sessionsCount}\n`;
            emailBody += `  Avg. session length: ${formatHours(avgSession)}\n\n`;
            emailBody += `TOP COURSE\n  ${topCourse[0]}: ${formatHours(topCourse[1])}\n\n`;
            emailBody += `DAILY BREAKDOWN\n${dailyLines}\n\n`;
            emailBody += `Log in to Studious to keep the momentum going!\nTo update your notification preferences, visit your account settings.\n\nBest,\nThe Studious Team`;

            await sendEmail({
                to: user.email,
                subject: "Studious - Weekly Study Report",
                text: emailBody
            });
        }
    } catch (err) {
        console.error("Error sending analytics reports:", err.message);
    }
}

// run every Monday at 8am
function startAnalyticsJob() {
    cron.schedule("0 8 * * 1", () => {
        console.log("Running analytics report job...");
        sendAnalyticsReport();
    });
}

//run every day at 8am
function startReminderJob() {
    cron.schedule("0 8 * * *", () => {
        console.log("Running reminder job...");
        sendReminders();
    });
}

module.exports = { startReminderJob, sendReminders, startAnalyticsJob, sendAnalyticsReport }