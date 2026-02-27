const authController = require("../controllers/authController");
const User = require("../models/User");
const sendEmail = require("../utils/email");

jest.mock("../models/User");
jest.mock("../utils/email");

jest.mock("bcryptjs", () => ({
    hash: jest.fn().mockResolvedValue("hashedpassword")
}));

describe("Forgot Password Controller", () => {

    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                email: "test@example.com"
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    test("should return 400 if email is blank", async () => {
        const req = {
            body: {
                email: ""
            }
        };

        await authController.forgotPassword(req, res);

        expect(User.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Email is required" });
    });

    test("should return 404 if user does not exist", async () => {
        User.findOne.mockResolvedValue(null);

        await authController.forgotPassword(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Email not found" });
    });

    test("should generate token and send email if user exists", async () => {
        const mockUser = {
            email: "test@example.com",
            save: jest.fn()
        };

        User.findOne.mockResolvedValue(mockUser);

        await authController.forgotPassword(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
        expect(sendEmail).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

});

describe("Reset Password Controller", () => {
    let res;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    test("should return 400 if email is blank", async () => {
        const req = {
            body: {
                email: "",
                token: "validtoken",
                newPassword: "newpassword123"
            }
        };

        await authController.resetPassword(req, res);

        expect(User.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Email is required" });
    });

    test("should return 400 if token is invalid", async () => {
        User.findOne.mockResolvedValue(null);

        const req = {
            body: {
                email: "test@example.com",
                token: "invalidtoken",
                newPassword: "newpassword123"
            }
        };

        await authController.resetPassword(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    });

    test("should return 400 if token is expired", async () => {
        const mockUser = {
            email: "test@example.com",
            resetPasswordToken: "validtoken",
            resetPasswordExpires: Date.now() - 10000,
            save: jest.fn()
        };

        User.findOne.mockResolvedValue(mockUser);

        const req = {
            body: {
                email: "test@example.com",
                token: "validtoken",
                newPassword: "newpassword123"
            }
        };

        await authController.resetPassword(req, res);

        expect(User.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Expired token" });
        expect(mockUser.save).not.toHaveBeenCalled();
    });

    test("should update password if token is valid", async () => {
        const mockUser = {
            email: "test@example.com",
            resetPasswordToken: "validtoken",
            resetPasswordExpires: Date.now() + 3600000,
            password: "oldpassword",
            save: jest.fn()
        };

        User.findOne.mockResolvedValue(mockUser);

        const req = {
            body: {
                email: "test@example.com",
                token: "validtoken",
                newPassword: "newpassword123"
            }
        };

        await authController.resetPassword(req, res);

        expect(User.findOne).toHaveBeenCalledWith({
            email: "test@example.com",
            resetPasswordToken: "validtoken"
        });

        expect(mockUser.password).toBe("hashedpassword");
        expect(mockUser.resetPasswordToken).toBeUndefined();
        expect(mockUser.resetPasswordExpires).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});