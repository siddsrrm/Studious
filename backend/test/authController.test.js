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

describe("Verify 2FA Controller", () => {
    let res;
    const jwt = require("jsonwebtoken");
    const validPendingToken = jwt.sign(
        { userId: "user123", stage: "2fa-pending" },
        process.env.JWT_SECRET || "testsecret"
    );
    const wrongStagePendingToken = jwt.sign(
        { userId: "user123", stage: "wrong-stage" },
        process.env.JWT_SECRET || "testsecret"
    );

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    test("should return 400 if code is missing", async () => {
        const req = { body: { pendingToken: validPendingToken } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Code and session token are required" });
    });

    test("should return 400 if pendingToken is missing", async () => {
        const req = { body: { code: "123456" } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Code and session token are required" });
    });

    test("should return 401 if pendingToken is invalid JWT", async () => {
        const req = { body: { code: "123456", pendingToken: "notavalidtoken" } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired session. Please log in again." });
    });

    test("should return 401 if pendingToken has wrong stage", async () => {
        const req = { body: { code: "123456", pendingToken: wrongStagePendingToken } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid token stage" });
    });

    test("should return 400 if user is not found", async () => {
        User.findById.mockResolvedValue(null);
        const req = { body: { code: "123456", pendingToken: validPendingToken } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "No pending 2FA found. Please log in again." });
    });

    test("should return 400 if user has no twoFactorCode", async () => {
        User.findById.mockResolvedValue({ twoFactorCode: null });
        const req = { body: { code: "123456", pendingToken: validPendingToken } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "No pending 2FA found. Please log in again." });
    });

    test("should return 400 if code is expired", async () => {
        const mockUser = {
            twoFactorCode: "hashedcode",
            twoFactorExpires: Date.now() - 10000, // expired
            save: jest.fn()
        };
        User.findById.mockResolvedValue(mockUser);
        const req = { body: { code: "123456", pendingToken: validPendingToken } };
        await authController.verify2FA(req, res);
        expect(mockUser.twoFactorCode).toBeUndefined();
        expect(mockUser.twoFactorExpires).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Code has expired. Please log in again." });
    });

    test("should return 400 if code is incorrect", async () => {
        const bcrypt = require("bcryptjs");
        bcrypt.compare = jest.fn().mockResolvedValue(false);
        const mockUser = {
            twoFactorCode: "hashedcode",
            twoFactorExpires: Date.now() + 600000, // not expired
            save: jest.fn()
        };
        User.findById.mockResolvedValue(mockUser);
        const req = { body: { code: "000000", pendingToken: validPendingToken } };
        await authController.verify2FA(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: "Invalid code. Please try again." });
    });

    test("should return 200 and session token if code is valid", async () => {
        const bcrypt = require("bcryptjs");
        bcrypt.compare = jest.fn().mockResolvedValue(true);
        const mockUser = {
            _id: "user123",
            username: "testuser",
            twoFactorEnabled: true,
            twoFactorCode: "hashedcode",
            twoFactorExpires: Date.now() + 600000, // not expired
            save: jest.fn()
        };
        User.findById.mockResolvedValue(mockUser);
        const req = { body: { code: "123456", pendingToken: validPendingToken } };
        await authController.verify2FA(req, res);
        expect(mockUser.twoFactorCode).toBeUndefined();
        expect(mockUser.twoFactorExpires).toBeUndefined();
        expect(mockUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Verification successful",
            username: "testuser",
            twoFactorEnabled: true
        }));
    });
});