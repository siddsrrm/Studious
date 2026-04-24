const {
  updateProfile,
  getInfo,
  nameChange,
  deleteAccount,
  emailChange,
  getNotificationSettings,
  updateNotificationSettings,
} = require("../controllers/userController.js");

jest.mock("../models/User");
jest.mock("../models/StudyPlan");
jest.mock("../models/FriendRequest");
jest.mock("../socket", () => ({ emitToUser: jest.fn(), emitToAll: jest.fn() }));

const User = require("../models/User");
const StudyPlan = require("../models/StudyPlan");
const FriendRequest = require("../models/FriendRequest");
const { emitToUser, emitToAll } = require("../socket");


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

describe("updateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 200 with message and avatar URL on success", async () => {
    const fakeUser = {
      _id: "user123",
      username: "jpbarath",
      avatar: "",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { avatar: "https://example.com/avatar.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: "Profile updated.",
      avatar: "https://example.com/avatar.png",
    });
  });

  test("calls User.findById with the correct userId", async () => {
    const fakeUser = {
      _id: "user123",
      username: "jpbarath",
      avatar: "",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { avatar: "https://example.com/avatar.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith("user123");
  });

  test("sets user.avatar to the new value before calling updateOne", async () => {
    const fakeUser = {
      _id: "user123",
      username: "jpbarath",
      avatar: "https://example.com/old.png",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { avatar: "https://example.com/new.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(fakeUser.avatar).toBe("https://example.com/new.png");
    expect(fakeUser.updateOne).toHaveBeenCalledTimes(1);
  });



  test("calls updateOne with correct object", async () => {
    const avatarUrl = "https://example.com/avatar.png";
    const fakeUser = {
      _id: "user123",
      username: "jpbarath",
      avatar: "",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { avatar: avatarUrl } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(fakeUser.updateOne).toHaveBeenCalledWith({ avatar: avatarUrl});
  });

  test("returns 404 when user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockReq({ body: { avatar: "https://example.com/avatar.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "user not found" });
  });

  test("does not call updateOne when user is not found", async () => {
    const updateOneSpy = jest.fn();
    User.findById.mockResolvedValue(null);

    const req = mockReq({ body: { avatar: "https://example.com/avatar.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(updateOneSpy).not.toHaveBeenCalled();
  });

  test("returns 500 when User.findById throws", async () => {
    User.findById.mockRejectedValue(new Error("DB connection lost"));

    const req = mockReq({ body: { avatar: "https://example.com/avatar.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "failed to update profile" });
  });

  test("returns 500 when user.updateOne throws", async () => {
    const fakeUser = {
      avatar: "",
      updateOne: jest.fn().mockRejectedValue(new Error("Write failed")),
    };
    User.findById.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { avatar: "https://example.com/avatar.png" } });
    const res = mockRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "failed to update profile" });
  });
});


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
    FriendRequest.find.mockResolvedValue([]);
    FriendRequest.deleteMany.mockResolvedValue({});
    User.deleteOne.mockResolvedValue({});

    const req = mockReq();
    const res = mockRes();

    await deleteAccount(req, res);

    expect(StudyPlan.deleteMany).toHaveBeenCalledWith({ owner: "user123" });
    expect(FriendRequest.deleteMany).toHaveBeenCalledWith({
      $or: [{ sender: "user123" }, { recipient: "user123" }],
    });
    expect(User.deleteOne).toHaveBeenCalledWith({ _id: "user123" });
    expect(res.json).toHaveBeenCalledWith({ message: "Account deleted successfully" });
  });

  test("notifies friends before deleting accepted friendships", async () => {
    const fakeUser = { _id: "user123", username: "jpbarath" };
    const accepted = [
      { _id: "req1", sender: { toString: () => "user123" }, recipient: { toString: () => "friend456" }, status: 1 },
      { _id: "req2", sender: { toString: () => "friend789" }, recipient: { toString: () => "user123" }, status: 1 },
    ];
    User.findById.mockResolvedValue(fakeUser);
    StudyPlan.deleteMany.mockResolvedValue({});
    FriendRequest.find.mockResolvedValue(accepted);
    FriendRequest.deleteMany.mockResolvedValue({});
    User.deleteOne.mockResolvedValue({});

    const req = mockReq();
    const res = mockRes();

    await deleteAccount(req, res);

    expect(FriendRequest.find).toHaveBeenCalledWith({
      $or: [{ sender: "user123" }, { recipient: "user123" }],
      status: 1,
    });
    expect(emitToUser).toHaveBeenCalledWith(
      "friend456",
      "unfriended",
      { requestId: "req1", actorName: "jpbarath" },
      expect.stringContaining("deleted their account")
    );
    expect(emitToUser).toHaveBeenCalledWith(
      "friend789",
      "unfriended",
      { requestId: "req2", actorName: "jpbarath" },
      expect.stringContaining("deleted their account")
    );
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
    expect(FriendRequest.find).not.toHaveBeenCalled();
    expect(FriendRequest.deleteMany).not.toHaveBeenCalled();
    expect(emitToUser).not.toHaveBeenCalled();
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

describe("getNotificationSettings", () => {
    let res;
    beforeEach(() => {
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    test("returns notification settings for the user", async () => {
        const mockSettings = { remindersEnabled: true, reminderDaysBefore: 1 };
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue({
                notificationSettings: mockSettings
            })
        });
        const req = { user: { userId: "user123" } };
        await getNotificationSettings(req, res);
        expect(res.json).toHaveBeenCalledWith(mockSettings);
    });

    test("returns 404 if user is not found", async () => {
        User.findById.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });
        const req = { user: { userId: "user123" } };
        await getNotificationSettings(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    test("returns 500 on server error", async () => {
        User.findById.mockReturnValue({
            select: jest.fn().mockRejectedValue(new Error("DB error"))
        });
        const req = { user: { userId: "user123" } };
        await getNotificationSettings(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe("updateNotificationSettings", () => {
    let res;
    beforeEach(() => {
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        jest.clearAllMocks();
    });

    test("returns 404 if user is not found", async () => {
        User.findById.mockResolvedValue(null);
        const req = {
            body: { remindersEnabled: false },
            user: { userId: "user123" }
        };
        await updateNotificationSettings(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
    });

    test("updates remindersEnabled and saves", async () => {
        const mockUser = {
            notificationSettings: { remindersEnabled: true, reminderDaysBefore: 1 },
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(mockUser);
        const req = {
            body: { remindersEnabled: false },
            user: { userId: "user123" }
        };
        await updateNotificationSettings(req, res);
        expect(mockUser.notificationSettings.remindersEnabled).toBe(false);
        expect(mockUser.notificationSettings.reminderDaysBefore).toBe(1); // unchanged
        expect(mockUser.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockUser.notificationSettings);
    });

    test("updates reminderDaysBefore and saves", async () => {
        const mockUser = {
            notificationSettings: { remindersEnabled: true, reminderDaysBefore: 1 },
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(mockUser);
        const req = {
            body: { reminderDaysBefore: 3 },
            user: { userId: "user123" }
        };
        await updateNotificationSettings(req, res);
        expect(mockUser.notificationSettings.reminderDaysBefore).toBe(3);
        expect(mockUser.notificationSettings.remindersEnabled).toBe(true); // unchanged
        expect(mockUser.save).toHaveBeenCalled();
    });

    test("updates both fields at once", async () => {
        const mockUser = {
            notificationSettings: { remindersEnabled: true, reminderDaysBefore: 1 },
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(mockUser);
        const req = {
            body: { remindersEnabled: false, reminderDaysBefore: 7 },
            user: { userId: "user123" }
        };
        await updateNotificationSettings(req, res);
        expect(mockUser.notificationSettings.remindersEnabled).toBe(false);
        expect(mockUser.notificationSettings.reminderDaysBefore).toBe(7);
        expect(mockUser.save).toHaveBeenCalled();
    });

    test("does not update fields that are not provided", async () => {
        const mockUser = {
            notificationSettings: { remindersEnabled: true, reminderDaysBefore: 3 },
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(mockUser);
        const req = { body: {}, user: { userId: "user123" } };
        await updateNotificationSettings(req, res);
        expect(mockUser.notificationSettings.remindersEnabled).toBe(true);
        expect(mockUser.notificationSettings.reminderDaysBefore).toBe(3);
        expect(mockUser.save).toHaveBeenCalled();
    });

    test("returns 500 on server error", async () => {
        User.findById.mockRejectedValue(new Error("DB error"));
        const req = {
            body: { remindersEnabled: false },
            user: { userId: "user123" }
        };
        await updateNotificationSettings(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

test("updates analyticsReportEnabled and saves", async () => {
    const mockUser = {
        notificationSettings: { remindersEnabled: true, reminderDaysBefore: 1, analyticsReportEnabled: false },
        save: jest.fn().mockResolvedValue(true)
    };
    User.findById.mockResolvedValue(mockUser);
    const req = {
        body: { analyticsReportEnabled: true },
        user: { userId: "user123" }
    };
    await updateNotificationSettings(req, res);
    expect(mockUser.notificationSettings.analyticsReportEnabled).toBe(true);
    expect(mockUser.notificationSettings.remindersEnabled).toBe(true);   // unchanged
    expect(mockUser.notificationSettings.reminderDaysBefore).toBe(1);    // unchanged
    expect(mockUser.save).toHaveBeenCalled();
});

test("updates all three fields at once", async () => {
    const mockUser = {
        notificationSettings: { remindersEnabled: true, reminderDaysBefore: 1, analyticsReportEnabled: false },
        save: jest.fn().mockResolvedValue(true)
    };
    User.findById.mockResolvedValue(mockUser);
    const req = {
        body: { remindersEnabled: false, reminderDaysBefore: 7, analyticsReportEnabled: true },
        user: { userId: "user123" }
    };
    await updateNotificationSettings(req, res);
    expect(mockUser.notificationSettings.remindersEnabled).toBe(false);
    expect(mockUser.notificationSettings.reminderDaysBefore).toBe(7);
    expect(mockUser.notificationSettings.analyticsReportEnabled).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
});

test("does not update analyticsReportEnabled when not provided", async () => {
    const mockUser = {
        notificationSettings: { remindersEnabled: true, reminderDaysBefore: 3, analyticsReportEnabled: true },
        save: jest.fn().mockResolvedValue(true)
    };
    User.findById.mockResolvedValue(mockUser);
    const req = { body: { remindersEnabled: false }, user: { userId: "user123" } };
    await updateNotificationSettings(req, res);
    expect(mockUser.notificationSettings.analyticsReportEnabled).toBe(true); // unchanged
    expect(mockUser.save).toHaveBeenCalled();
});
});

// updatePrivacy tests
describe("updatePrivacy", () => {
  const { updatePrivacy } = require("../controllers/userController.js");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates profile visibility successfully", async () => {
    const fakeUser = {
      _id: "user123",
      updateOne: jest.fn().mockResolvedValue({}),
    };
    User.findById.mockResolvedValue(fakeUser);

    const req = mockReq({ body: { profileVisibility: "friends" } });
    const res = mockRes();

    await updatePrivacy(req, res);

    expect(fakeUser.updateOne).toHaveBeenCalledWith({ profileVisibility: "friends" });
    expect(res.json).toHaveBeenCalledWith({
      message: "Privacy settings updated.",
      profileVisibility: "friends",
    });
  });

  test("accepts all three valid visibility options", async () => {
    const validOptions = ["public", "friends", "hidden"];

    for (const option of validOptions) {
      const fakeUser = {
        _id: "user123",
        updateOne: jest.fn().mockResolvedValue({}),
      };
      User.findById.mockResolvedValue(fakeUser);

      const req = mockReq({ body: { profileVisibility: option } });
      const res = mockRes();

      await updatePrivacy(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Privacy settings updated.",
        profileVisibility: option,
      });
    }
  });

  test("returns 400 for an invalid visibility option", async () => {
    const req = mockReq({ body: { profileVisibility: "everyone" } });
    const res = mockRes();

    await updatePrivacy(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid visibility option." });
  });

  test("does not call findById when visibility option is invalid", async () => {
    const req = mockReq({ body: { profileVisibility: "invalid" } });
    const res = mockRes();

    await updatePrivacy(req, res);

    expect(User.findById).not.toHaveBeenCalled();
  });

  test("returns 404 when user is not found", async () => {
    User.findById.mockResolvedValue(null);

    const req = mockReq({ body: { profileVisibility: "public" } });
    const res = mockRes();

    await updatePrivacy(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  test("returns 500 on unexpected error", async () => {
    User.findById.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ body: { profileVisibility: "public" } });
    const res = mockRes();

    await updatePrivacy(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to update privacy settings." });
  });
});

// searchUsers tests
describe("searchUsers", () => {
  const { searchUsers } = require("../controllers/userController.js");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty array when no query string is provided", async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();

    await searchUsers(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
    expect(User.find).not.toHaveBeenCalled();
  });

  test("returns matching public users", async () => {
    FriendRequest.find.mockResolvedValue([]);
    const fakeUsers = [
      { _id: "abc", username: "alice", avatar: "" },
      { _id: "def", username: "alicia", avatar: "" },
    ];
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(fakeUsers) }) });

    const req = mockReq({ query: { q: "ali" } });
    const res = mockRes();

    await searchUsers(req, res);

    expect(res.json).toHaveBeenCalledWith(fakeUsers);
  });

  test("excludes the searching user from results", async () => {
    FriendRequest.find.mockResolvedValue([]);
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) });

    const req = mockReq({ query: { q: "alice" } });
    const res = mockRes();

    await searchUsers(req, res);

    const findArg = User.find.mock.calls[0][0];
    expect(findArg._id).toEqual({ $ne: "user123" });
  });

  test("includes friends-only users when requester is a friend", async () => {
    FriendRequest.find.mockResolvedValue([
      { sender: { toString: () => "user123" }, recipient: { toString: () => "friend456" }, status: 1 },
    ]);

    const fakeUsers = [{ _id: "friend456", username: "friendUser", avatar: "" }];
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue(fakeUsers) }) });

    const req = mockReq({ query: { q: "friend" } });
    const res = mockRes();

    await searchUsers(req, res);

    const findArg = User.find.mock.calls[0][0];
    const friendsOnlyCondition = findArg.$or.find(
      (c) => c.profileVisibility === "friends"
    );
    expect(friendsOnlyCondition._id.$in).toContain("friend456");
    expect(res.json).toHaveBeenCalledWith(fakeUsers);
  });

  test("does not include hidden users in results", async () => {
    FriendRequest.find.mockResolvedValue([]);
    User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) });

    const req = mockReq({ query: { q: "ghost" } });
    const res = mockRes();

    await searchUsers(req, res);

    const findArg = User.find.mock.calls[0][0];
    // "hidden" should not appear as an allowed visibility option
    const allowedVisibilities = findArg.$or.map((c) => c.profileVisibility).filter(Boolean);
    expect(allowedVisibilities).not.toContain("hidden");
  });

  test("returns 500 on unexpected error", async () => {
    FriendRequest.find.mockRejectedValue(new Error("DB error"));

    const req = mockReq({ query: { q: "alice" } });
    const res = mockRes();

    await searchUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Failed to search users" });
  });
});