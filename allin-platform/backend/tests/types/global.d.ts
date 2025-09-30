// Global type declarations for test utilities

declare global {
  var createMockRequest: (overrides?: any) => any;
  var createMockResponse: () => any;
  var createMockNext: () => jest.Mock;
}

export {};