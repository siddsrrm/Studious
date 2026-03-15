const { sendReminders } = require("../utils/reminderJob");
const Task = require("../models/Task");
const User = require("../models/User");
const sendEmail = require("../utils/email");

jest.mock("../models/Task");
jest.mock("../models/User");
jest.mock("../utils/email");

const makeUser = (overrides = {}) => ({
    _id: "user123",
    email: "test@example.com",
    username: "testuser",
    notificationSettings: {
        remindersEnabled: true,
        reminderDaysBefore: 3,
        ...overrides
    }
});

beforeEach(() => jest.clearAllMocks());

describe("sendReminders", () => {

    // --- no email cases ---

    test("does not send email when no users have reminders enabled", async () => {
        User.find.mockResolvedValue([]);
        await sendReminders();
        expect(sendEmail).not.toHaveBeenCalled();
    });

    test("does not send email when user has no upcoming or overdue tasks", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find.mockResolvedValue([]); // both queries return empty
        await sendReminders();
        expect(sendEmail).not.toHaveBeenCalled();
    });

    // --- upcoming tasks ---

    test("sends email when user has upcoming tasks", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([{ title: "Study for exam", dueDate: new Date() }]) // upcoming
            .mockResolvedValueOnce([]); // overdue
        await sendReminders();
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com",
            subject: "Studious — Task Reminders"
        }));
    });

    test("email body includes upcoming task title", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([{ title: "Study for exam", dueDate: new Date() }])
            .mockResolvedValueOnce([]);
        await sendReminders();
        const emailText = sendEmail.mock.calls[0][0].text;
        expect(emailText).toContain("Study for exam");
        expect(emailText).toContain("UPCOMING TASKS");
    });

    test("email body includes correct reminder window in days", async () => {
        User.find.mockResolvedValue([makeUser({ reminderDaysBefore: 7 })]);
        Task.find
            .mockResolvedValueOnce([{ title: "Task 1", dueDate: new Date() }])
            .mockResolvedValueOnce([]);
        await sendReminders();
        const emailText = sendEmail.mock.calls[0][0].text;
        expect(emailText).toContain("7 day(s)");
    });

    // --- overdue tasks ---

    test("sends email when user has overdue tasks", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([]) // upcoming
            .mockResolvedValueOnce([{ title: "Late assignment", dueDate: new Date("2026-01-01") }]); // overdue
        await sendReminders();
        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    test("email body includes overdue task title", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ title: "Late assignment", dueDate: new Date("2026-01-01") }]);
        await sendReminders();
        const emailText = sendEmail.mock.calls[0][0].text;
        expect(emailText).toContain("Late assignment");
        expect(emailText).toContain("OVERDUE TASKS");
    });

    // --- both lists ---

    test("email body includes both sections when user has upcoming and overdue tasks", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([{ title: "Upcoming task", dueDate: new Date() }])
            .mockResolvedValueOnce([{ title: "Overdue task", dueDate: new Date("2026-01-01") }]);
        await sendReminders();
        const emailText = sendEmail.mock.calls[0][0].text;
        expect(emailText).toContain("UPCOMING TASKS");
        expect(emailText).toContain("OVERDUE TASKS");
        expect(emailText).toContain("Upcoming task");
        expect(emailText).toContain("Overdue task");
    });

    test("email does not include overdue section when there are no overdue tasks", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([{ title: "Upcoming task", dueDate: new Date() }])
            .mockResolvedValueOnce([]);
        await sendReminders();
        const emailText = sendEmail.mock.calls[0][0].text;
        expect(emailText).not.toContain("OVERDUE TASKS");
    });

    test("email does not include upcoming section when there are no upcoming tasks", async () => {
        User.find.mockResolvedValue([makeUser()]);
        Task.find
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ title: "Overdue task", dueDate: new Date("2026-01-01") }]);
        await sendReminders();
        const emailText = sendEmail.mock.calls[0][0].text;
        expect(emailText).not.toContain("UPCOMING TASKS");
    });

    // --- multiple users ---

    test("sends separate emails for each user with tasks", async () => {
        User.find.mockResolvedValue([makeUser(), { ...makeUser(), _id: "user456", email: "other@example.com" }]);
        Task.find.mockResolvedValue([{ title: "Task 1", dueDate: new Date() }]);
        await sendReminders();
        expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    test("skips users with no tasks even when other users have tasks", async () => {
        User.find.mockResolvedValue([
            makeUser(),
            { ...makeUser(), _id: "user456", email: "other@example.com" }
        ]);
        Task.find
            .mockResolvedValueOnce([{ title: "Task 1", dueDate: new Date() }]) // user1 upcoming
            .mockResolvedValueOnce([]) // user1 overdue
            .mockResolvedValueOnce([]) // user2 upcoming
            .mockResolvedValueOnce([]); // user2 overdue
        await sendReminders();
        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com"
        }));
    });

    // --- error handling ---

    test("handles errors gracefully without crashing", async () => {
        User.find.mockRejectedValue(new Error("DB error"));
        await expect(sendReminders()).resolves.not.toThrow();
    });
});