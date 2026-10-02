module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/env.ts"],
  setupFilesAfterEnv:["<rootDir>/tests/setupAfterEnv.ts"],
  testTimeout: 15000,
};