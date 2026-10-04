module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  globalSetup: "<rootDir>/tests/globalSetup.js",
  globalTeardown: "<rootDir>/tests/globalTeardown.js",
  setupFiles: ["<rootDir>/tests/env.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupAfterEnv.ts"],
  testTimeout: 15000,
};