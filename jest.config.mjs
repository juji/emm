export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {},
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(chalk|consola|ora|archy)/)'
  ],
  globals: {},
};
