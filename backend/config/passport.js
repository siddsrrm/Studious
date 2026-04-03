const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    accessType: "offline",
    prompt: "consent"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (user) {
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken || user.googleRefreshToken;
        user.googleCalendarConnected = true;
        await user.save();
        return done(null, user);
      }

      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken || user.googleRefreshToken;
        user.googleCalendarConnected = true;
        await user.save();
        return done(null, user);
      }

      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.displayName,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleCalendarConnected: true,
      });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;