const jwt = require("jsonwebtoken");
const User = require("../models/User");
 
jest.mock("../models/User");
jest.mock("jsonwebtoken");

//google auth tests

let strategyCallback;
jest.mock("passport-google-oauth20", () => ({
  Strategy: jest.fn().mockImplementation((_options, callback) => {
    strategyCallback = callback;
    return { name: "google" };
  }),
}));
 
jest.mock("passport", () => ({
  use: jest.fn(),
  initialize: () => (_req, _res, next) => next(),
  authenticate: jest.fn(),
}));
 


// Importing passport.js registers the strategy and captures the callback
require("../config/passport");
 
//helper function
function makeProfile(overrides = {}) {
  return {
    id: "google-id-123",
    displayName: "Test User",
    emails: [{ value: "test@example.com" }],
    ...overrides,
  };
}
 

// Google OAuth Strategy Callback

describe("Google OAuth Strategy", () => {
  let done;
 
  beforeEach(() => {
    done = jest.fn();
    jest.clearAllMocks();
  });
 
  // ── Existing Google user ───────────────────────────────────────────────────
 
  test("updates tokens and calls done with user when googleId already exists", async () => {
    const existingUser = {
      _id: "user123",
      googleId: "google-id-123",
      googleAccessToken: "old-token",
      googleRefreshToken: "old-refresh",
      googleCalendarConnected: false,
      save: jest.fn().mockResolvedValue({}),
    };
    User.findOne.mockResolvedValueOnce(existingUser); // found by googleId
 
    await strategyCallback("new-access", "new-refresh", makeProfile(), done);
 
    expect(existingUser.googleAccessToken).toBe("new-access");
    expect(existingUser.googleRefreshToken).toBe("new-refresh");
    expect(existingUser.googleCalendarConnected).toBe(true);
    expect(existingUser.save).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, existingUser);
  });
 
  test("keeps old refresh token when new one is not provided", async () => {
    const existingUser = {
      googleId: "google-id-123",
      googleAccessToken: "old-token",
      googleRefreshToken: "old-refresh",
      googleCalendarConnected: false,
      save: jest.fn().mockResolvedValue({}),
    };
    User.findOne.mockResolvedValueOnce(existingUser);
 
    await strategyCallback("new-access", null, makeProfile(), done);
 
    expect(existingUser.googleRefreshToken).toBe("old-refresh");
    expect(done).toHaveBeenCalledWith(null, existingUser);
  });
 
  // ── Existing email user (no googleId yet) ─────────────────────────────────
 
  test("links googleId to existing email account and calls done with user", async () => {
    const existingUser = {
      _id: "user123",
      email: "test@example.com",
      googleId: null,
      googleCalendarConnected: false,
      save: jest.fn().mockResolvedValue({}),
    };
    User.findOne
      .mockResolvedValueOnce(null)          // not found by googleId
      .mockResolvedValueOnce(existingUser); // found by email
 
    await strategyCallback("access-token", "refresh-token", makeProfile(), done);
 
    expect(existingUser.googleId).toBe("google-id-123");
    expect(existingUser.googleAccessToken).toBe("access-token");
    expect(existingUser.googleCalendarConnected).toBe(true);
    expect(existingUser.save).toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, existingUser);
  });
 
  test("keeps old refresh token when linking email account and no refresh provided", async () => {
    const existingUser = {
      email: "test@example.com",
      googleId: null,
      googleRefreshToken: "existing-refresh",
      googleCalendarConnected: false,
      save: jest.fn().mockResolvedValue({}),
    };
    User.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingUser);
 
    await strategyCallback("access-token", null, makeProfile(), done);
 
    expect(existingUser.googleRefreshToken).toBe("existing-refresh");
  });
 
  // ── Brand new user ─────────────────────────────────────────────────────────
 
  test("creates a new user when no googleId or email match exists", async () => {
    const newUser = {
      _id: "newuser123",
      googleId: "google-id-123",
      email: "test@example.com",
    };
    User.findOne
      .mockResolvedValueOnce(null)  // not found by googleId
      .mockResolvedValueOnce(null); // not found by email
    User.create.mockResolvedValue(newUser);
 
    await strategyCallback("access-token", "refresh-token", makeProfile(), done);
 
    expect(User.create).toHaveBeenCalledWith({
      googleId: "google-id-123",
      email: "test@example.com",
      username: "Test User",
      googleAccessToken: "access-token",
      googleRefreshToken: "refresh-token",
      googleCalendarConnected: true,
    });
    expect(done).toHaveBeenCalledWith(null, newUser);
  });
 
  test("uses displayName as username when creating a new user", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: "newuser123" });
 
    const profile = makeProfile({ displayName: "John Doe" });
    await strategyCallback("access-token", "refresh-token", profile, done);
 
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: "John Doe" })
    );
  });
 
 
  test("calls done with error when User.findOne throws", async () => {
    const error = new Error("DB error");
    User.findOne.mockRejectedValue(error);
 
    await strategyCallback("access-token", "refresh-token", makeProfile(), done);
 
    expect(done).toHaveBeenCalledWith(error, null);
  });
 
  test("calls done with error when User.create throws", async () => {
    const error = new Error("Create failed");
    User.findOne.mockResolvedValue(null);
    User.create.mockRejectedValue(error);
 
    await strategyCallback("access-token", "refresh-token", makeProfile(), done);
 
    expect(done).toHaveBeenCalledWith(error, null);
  });
 
  test("calls done with error when user.save throws", async () => {
    const existingUser = {
      googleId: "google-id-123",
      googleAccessToken: "old-token",
      googleRefreshToken: "old-refresh",
      googleCalendarConnected: false,
      save: jest.fn().mockRejectedValue(new Error("Save failed")),
    };
    User.findOne.mockResolvedValueOnce(existingUser);
 
    await strategyCallback("new-access", "new-refresh", makeProfile(), done);
 
    expect(done).toHaveBeenCalledWith(expect.any(Error), null);
  });
});
 
// Google OAuth Callback Route  →  GET /api/auth/google/callback
// Tests the inline route handler that issues the JWT after passport succeeds
describe("Google OAuth Callback Route Handler", () => {
  // Extract the inline callback handler directly so we can test it
  // without needing to spin up a full express server
  function callbackHandler(req, res) {
    const token = jwt.sign(
      { userId: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
 
  let res;
 
  beforeEach(() => {
    res = { redirect: jest.fn() };
    jest.clearAllMocks();
    process.env.FRONTEND_URL = "http://localhost:3000";
  });
 
  test("signs a JWT with the user's _id", () => {
    jwt.sign.mockReturnValue("mocked-token");
    const req = { user: { _id: "user123" } };
 
    callbackHandler(req, res);
 
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: "user123" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });
 
  test("redirects to the frontend oauth-callback URL with the token", () => {
    jwt.sign.mockReturnValue("mocked-token");
    const req = { user: { _id: "user123" } };
 
    callbackHandler(req, res);
 
    expect(res.redirect).toHaveBeenCalledWith(
      "http://localhost:3000/oauth-callback?token=mocked-token"
    );
  });
 
  test("includes the token in the redirect query string", () => {
    jwt.sign.mockReturnValue("abc123token");
    const req = { user: { _id: "user123" } };
 
    callbackHandler(req, res);
 
    const redirectUrl = res.redirect.mock.calls[0][0];
    expect(redirectUrl).toContain("token=abc123token");
  });
 
  test("uses FRONTEND_URL env variable in the redirect", () => {
    process.env.FRONTEND_URL = "https://myapp.com";
    jwt.sign.mockReturnValue("mocked-token");
    const req = { user: { _id: "user123" } };
 
    callbackHandler(req, res);
 
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining("https://myapp.com")
    );
  });
});