module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  
  // Path alias 매핑 - 심플하게
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  
  // 중복 모듈 로딩 방지
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};