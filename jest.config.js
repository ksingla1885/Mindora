module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/src/app/api/', // Ignore API routes
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**', // Ignore app directory (Next.js 13+)
    '!src/pages/**', // Ignore pages directory
    '!src/styles/**', // Ignore style files
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/jest.setup.js',
  ],
  coverageThreshold: {
    global: {
      branches: 60, // Temporarily lowered for development
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@babel|@testing-library|@radix-ui|@stripe|@hookform|react-dnd|dnd-core|react-dnd-html5-backend|react-markdown|rehype|remark|vfile|unist-.*|unified|bail|is-plain-obj|trough|vfile-message|micromark.*|decode-named-character-reference|character-entities|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|pretty-bytes)/)',
  ],
};
