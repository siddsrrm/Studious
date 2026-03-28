module.exports = {
  testEnvironment: "jsdom", // necessary for testing React components
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // optional, for extra configs
  moduleFileExtensions: ["js", "jsx"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
};
