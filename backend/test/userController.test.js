const {
  getInfo,
  nameChange,
  deleteAccount,
  emailChange,
} = require("../controllers/userController.js");

jest.mock("../models/User");
jest.mock("../models/StudyPlan");

const User = require("../models/User");
const StudyPlan = require("../models/StudyPlan");


function mockReq(overrides = {}) {
  return {
    user: { userId: "user123" },
    body: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res); // allows res.status(x).json(y)
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

//getInfo tests
describe("getInfo", () => {
    beforeEach(() => {
  jest.clearAllMocks();
});

  test("returns user data when user is found", async () => {
    const fakeUser = { _id: "user123", username: "aaron" };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    const req = mockReq();
    const res = mockRes();

    await getInfo(req, res);

    expect(User.findById).toHaveBeenCalledWith("user123");
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });

  test("returns 404 when user is not found", async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const req = mockReq();
    const res = mockRes();

    await getInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 500 on unexpected error", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    const req = mockReq();
    const res = mockRes();

    await getInfo(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to fetch user info" });
  });
});

// nameChange tests
describe("nameChange", () => {

    beforeEach(() => {
  jest.clearAllMocks();
});
  test("updates username successfully", async () => {
    const fakeUser = {
      _id: "user123",
      username: "oldname",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);
    User.findOne.mockResolvedValue(null); // new name not taken

    const req = mockReq({ body: { name: "newname" } });
    const res = mockRes();

    await nameChange(req, res);

    expect(fakeUser.updateOne).toHaveBeenCalledWith({ username: "newname" });
    expect(res.json).toHaveBeenCalledWith({ message: "Name updated successfully" });
  });

  test("returns 404 when user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockReq({ body: { name: "newname" } });
    const res = mockRes();

    await nameChange(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 400 when username is already taken", async () => {
    User.findById.mockResolvedValue({ _id: "user123", username: "oldname" });
    User.findOne.mockResolvedValue({ _id: "otherUser" }); // name already exists

    const req = mockReq({ body: { name: "takenname" } });
    const res = mockRes();

    await nameChange(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Username already taken" });
  });
});

// deleteAccount tests
describe("deleteAccount", () => {
    beforeEach(() => {
  jest.clearAllMocks();
});
  test("deletes user and their study plans successfully", async () => {
    const fakeUser = { _id: "user123" };
    User.findById.mockResolvedValue(fakeUser);
    StudyPlan.deleteMany.mockResolvedValue({});
    User.deleteOne.mockResolvedValue({});

    const req = mockReq();
    const res = mockRes();

    await deleteAccount(req, res);

    expect(StudyPlan.deleteMany).toHaveBeenCalledWith({ owner: "user123" });
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: "user123" });
    expect(res.json).toHaveBeenCalledWith({ message: "Account deleted successfully" });
  });

  test("returns 404 when user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockReq();
    const res = mockRes();

    await deleteAccount(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("does not delete study plans if user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockReq();
    const res = mockRes();

    await deleteAccount(req, res);

    expect(StudyPlan.deleteMany).not.toHaveBeenCalled();
  });
});

//emailchange tests
describe("emailChange", () => {
    beforeEach(() => {
  jest.clearAllMocks();
});
  test("updates email successfully", async () => {
    const fakeUser = {
      _id: "user123",
      email: "old@example.com",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);
    User.findOne.mockResolvedValue(null); // new email not taken

    const req = mockReq({ body: { email: "new@example.com" } });
    const res = mockRes();

    await emailChange(req, res);

    expect(fakeUser.updateOne).toHaveBeenCalledWith({ email: "new@example.com" });
    expect(res.json).toHaveBeenCalledWith({ message: "Email updated successfully" });
  });

  test("returns 404 when user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockReq({ body: { email: "new@example.com" } });
    const res = mockRes();

    await emailChange(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 400 when new email is the same as current email", async () => {
    User.findById.mockResolvedValue({ _id: "user123", email: "same@example.com" });

    const req = mockReq({ body: { email: "same@example.com" } });
    const res = mockRes();

    await emailChange(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "New email is the same as the current email",
    });
  });

  test("returns 400 when email is already in use", async () => {
    User.findById.mockResolvedValue({ _id: "user123", email: "old@example.com" });
    User.findOne.mockResolvedValue({ _id: "otherUser" }); // email taken

    const req = mockReq({ body: { email: "taken@example.com" } });
    const res = mockRes();

    await emailChange(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Email already in use" });
  });

  test("returns 500 on unexpected error", async () => {
    User.findById.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ body: { email: "new@example.com" } });
    const res = mockRes();

    await emailChange(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to update email" });
  });
});