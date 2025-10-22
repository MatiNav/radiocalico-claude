module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/tests/frontend/**/*.test.js'],
  collectCoverageFrom: [
    'public/**/*.js',
    '!public/**/*.test.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
