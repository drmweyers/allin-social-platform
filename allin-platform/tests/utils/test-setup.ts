/**
 * Bulletproof Test Setup Utilities
 * Deterministic, hermetic, and fast test environment configuration
 */

import { faker } from '@faker-js/faker';

// ============================================================================
// TIME CONTROL - Freeze time for deterministic tests
// ============================================================================

export class TimeController {
  private static originalDate = Date;
  private static currentTime: number = new Date('2025-01-01T00:00:00.000Z').getTime();
  private static timers: Map<number, any> = new Map();
  private static nextTimerId = 1;

  /**
   * Freeze time at a specific point
   */
  static freeze(date: Date | string | number = '2025-01-01T00:00:00.000Z'): void {
    this.currentTime = new Date(date).getTime();

    // Override Date constructor
    global.Date = class extends this.originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(TimeController.currentTime);
        } else {
          super(...args);
        }
      }

      static now() {
        return TimeController.currentTime;
      }
    } as any;

    // Override timer functions
    global.setTimeout = this.mockSetTimeout.bind(this);
    global.setInterval = this.mockSetInterval.bind(this);
    global.clearTimeout = this.mockClearTimeout.bind(this);
    global.clearInterval = this.mockClearInterval.bind(this);
  }

  /**
   * Advance time by specified milliseconds
   */
  static advance(ms: number): void {
    this.currentTime += ms;
    this.runTimers(ms);
  }

  /**
   * Restore original time functions
   */
  static restore(): void {
    global.Date = this.originalDate;
    this.timers.clear();
  }

  private static mockSetTimeout(callback: Function, delay: number = 0): number {
    const id = this.nextTimerId++;
    this.timers.set(id, { callback, delay, type: 'timeout' });
    return id;
  }

  private static mockSetInterval(callback: Function, delay: number = 0): number {
    const id = this.nextTimerId++;
    this.timers.set(id, { callback, delay, type: 'interval', lastRun: 0 });
    return id;
  }

  private static mockClearTimeout(id: number): void {
    this.timers.delete(id);
  }

  private static mockClearInterval(id: number): void {
    this.timers.delete(id);
  }

  private static runTimers(elapsed: number): void {
    for (const [id, timer] of this.timers.entries()) {
      if (timer.type === 'timeout' && timer.delay <= elapsed) {
        timer.callback();
        this.timers.delete(id);
      } else if (timer.type === 'interval') {
        const runs = Math.floor((elapsed - timer.lastRun) / timer.delay);
        for (let i = 0; i < runs; i++) {
          timer.callback();
        }
        timer.lastRun += runs * timer.delay;
      }
    }
  }
}

// ============================================================================
// RANDOM SEEDING - Deterministic random values
// ============================================================================

export class RandomController {
  private static seed: number = 12345;
  private static originalMath = Math;

  /**
   * Seed random number generation for deterministic tests
   */
  static seed(value: number = 12345): void {
    this.seed = value;
    faker.seed(value);

    // Override Math.random with seeded PRNG
    let currentSeed = value;
    Math.random = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Generate deterministic UUID
   */
  static uuid(): string {
    return faker.string.uuid();
  }

  /**
   * Restore original Math.random
   */
  static restore(): void {
    Math.random = this.originalMath.random;
  }
}

// ============================================================================
// NETWORK MOCKING - Control all external requests
// ============================================================================

export class NetworkController {
  private static requests: Map<string, any> = new Map();
  private static delays: Map<string, number> = new Map();

  /**
   * Mock a network endpoint
   */
  static mock(pattern: string | RegExp, response: any, options?: {
    status?: number;
    headers?: Record<string, string>;
    delay?: number;
  }): void {
    const key = pattern.toString();
    this.requests.set(key, {
      pattern,
      response,
      status: options?.status || 200,
      headers: options?.headers || {},
      delay: options?.delay || 0
    });

    if (options?.delay) {
      this.delays.set(key, options.delay);
    }
  }

  /**
   * Simulate network failure
   */
  static fail(pattern: string | RegExp, error?: Error): void {
    const key = pattern.toString();
    this.requests.set(key, {
      pattern,
      error: error || new Error('Network request failed'),
      shouldFail: true
    });
  }

  /**
   * Simulate slow network
   */
  static slow(pattern: string | RegExp, delay: number): void {
    const key = pattern.toString();
    this.delays.set(key, delay);
  }

  /**
   * Clear all mocks
   */
  static clear(): void {
    this.requests.clear();
    this.delays.clear();
  }

  /**
   * Get mock response for URL
   */
  static getResponse(url: string): any {
    for (const [_, mock] of this.requests.entries()) {
      const pattern = mock.pattern;
      const matches = pattern instanceof RegExp
        ? pattern.test(url)
        : url.includes(pattern);

      if (matches) {
        if (mock.shouldFail) {
          throw mock.error;
        }
        return {
          data: mock.response,
          status: mock.status,
          headers: mock.headers
        };
      }
    }
    return null;
  }
}

// ============================================================================
// DATABASE MOCKING - In-memory database for tests
// ============================================================================

export class DatabaseController {
  private static data: Map<string, Map<string, any>> = new Map();
  private static ids: Map<string, number> = new Map();

  /**
   * Reset database to clean state
   */
  static reset(): void {
    this.data.clear();
    this.ids.clear();
  }

  /**
   * Seed database with test data
   */
  static seed(collection: string, records: any[]): void {
    const table = this.data.get(collection) || new Map();
    records.forEach((record, index) => {
      const id = record.id || `${collection}_${index + 1}`;
      table.set(id, { ...record, id });
    });
    this.data.set(collection, table);
    this.ids.set(collection, records.length);
  }

  /**
   * Find records in collection
   */
  static find(collection: string, query?: any): any[] {
    const table = this.data.get(collection);
    if (!table) return [];

    const results = Array.from(table.values());
    if (!query) return results;

    return results.filter(record => {
      return Object.entries(query).every(([key, value]) => {
        return record[key] === value;
      });
    });
  }

  /**
   * Insert record into collection
   */
  static insert(collection: string, record: any): any {
    const table = this.data.get(collection) || new Map();
    const currentId = this.ids.get(collection) || 0;
    const id = record.id || `${collection}_${currentId + 1}`;

    const newRecord = { ...record, id };
    table.set(id, newRecord);

    this.data.set(collection, table);
    this.ids.set(collection, currentId + 1);

    return newRecord;
  }

  /**
   * Update record in collection
   */
  static update(collection: string, id: string, updates: any): any {
    const table = this.data.get(collection);
    if (!table) throw new Error(`Collection ${collection} not found`);

    const record = table.get(id);
    if (!record) throw new Error(`Record ${id} not found in ${collection}`);

    const updated = { ...record, ...updates, id };
    table.set(id, updated);

    return updated;
  }

  /**
   * Delete record from collection
   */
  static delete(collection: string, id: string): boolean {
    const table = this.data.get(collection);
    if (!table) return false;
    return table.delete(id);
  }
}

// ============================================================================
// FILE SYSTEM MOCKING - Virtual file system for tests
// ============================================================================

export class FileSystemController {
  private static files: Map<string, string | Buffer> = new Map();
  private static directories: Set<string> = new Set();

  /**
   * Reset file system
   */
  static reset(): void {
    this.files.clear();
    this.directories.clear();
  }

  /**
   * Write file to virtual file system
   */
  static writeFile(path: string, content: string | Buffer): void {
    this.files.set(path, content);

    // Add parent directories
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      this.directories.add(parts.slice(0, i).join('/'));
    }
  }

  /**
   * Read file from virtual file system
   */
  static readFile(path: string): string | Buffer {
    const content = this.files.get(path);
    if (!content) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  /**
   * Check if file exists
   */
  static exists(path: string): boolean {
    return this.files.has(path) || this.directories.has(path);
  }

  /**
   * List directory contents
   */
  static readdir(path: string): string[] {
    if (!this.directories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, scandir '${path}'`);
    }

    const results: string[] = [];
    const prefix = path.endsWith('/') ? path : `${path}/`;

    for (const file of this.files.keys()) {
      if (file.startsWith(prefix)) {
        const relative = file.slice(prefix.length);
        const parts = relative.split('/');
        if (parts.length === 1) {
          results.push(parts[0]);
        }
      }
    }

    return results;
  }
}

// ============================================================================
// TEST DATA FACTORIES - Generate consistent test data
// ============================================================================

export class TestDataFactory {
  /**
   * Create a test user with deterministic data
   */
  static createUser(overrides?: Partial<any>): any {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatar: faker.image.avatar(),
      role: 'user',
      verified: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      ...overrides
    };
  }

  /**
   * Create a test post with deterministic data
   */
  static createPost(overrides?: Partial<any>): any {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(3),
      authorId: faker.string.uuid(),
      status: 'draft',
      platforms: ['facebook', 'twitter'],
      scheduledAt: null,
      publishedAt: null,
      tags: faker.lorem.words(3).split(' '),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      ...overrides
    };
  }

  /**
   * Create test authentication tokens
   */
  static createAuthTokens(): { accessToken: string; refreshToken: string } {
    return {
      accessToken: 'test-access-token-' + faker.string.alphanumeric(40),
      refreshToken: 'test-refresh-token-' + faker.string.alphanumeric(40)
    };
  }

  /**
   * Create test API response
   */
  static createApiResponse(data: any, options?: {
    status?: number;
    message?: string;
    errors?: any[];
  }): any {
    return {
      success: options?.status ? options.status < 400 : true,
      status: options?.status || 200,
      message: options?.message || 'Success',
      data,
      errors: options?.errors || [],
      timestamp: new Date('2025-01-01').toISOString()
    };
  }
}

// ============================================================================
// PERFORMANCE MONITORING - Track test performance
// ============================================================================

export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number[]> = new Map();

  /**
   * Start performance measurement
   */
  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End performance measurement
   */
  static measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) throw new Error(`Mark ${startMark} not found`);

    const duration = performance.now() - start;

    const measurements = this.measures.get(name) || [];
    measurements.push(duration);
    this.measures.set(name, measurements);

    return duration;
  }

  /**
   * Get performance statistics
   */
  static getStats(name: string): {
    min: number;
    max: number;
    avg: number;
    p95: number;
    p99: number;
  } | null {
    const measurements = this.measures.get(name);
    if (!measurements || measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Clear all measurements
   */
  static clear(): void {
    this.marks.clear();
    this.measures.clear();
  }

  /**
   * Assert performance budget
   */
  static assertBudget(name: string, budget: {
    avg?: number;
    p95?: number;
    p99?: number;
    max?: number;
  }): void {
    const stats = this.getStats(name);
    if (!stats) throw new Error(`No measurements for ${name}`);

    if (budget.avg && stats.avg > budget.avg) {
      throw new Error(`Average ${stats.avg}ms exceeds budget ${budget.avg}ms`);
    }
    if (budget.p95 && stats.p95 > budget.p95) {
      throw new Error(`P95 ${stats.p95}ms exceeds budget ${budget.p95}ms`);
    }
    if (budget.p99 && stats.p99 > budget.p99) {
      throw new Error(`P99 ${stats.p99}ms exceeds budget ${budget.p99}ms`);
    }
    if (budget.max && stats.max > budget.max) {
      throw new Error(`Max ${stats.max}ms exceeds budget ${budget.max}ms`);
    }
  }
}

// ============================================================================
// TEST HELPERS - Common test utilities
// ============================================================================

/**
 * Wait for condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    message?: string;
  }
): Promise<void> {
  const timeout = options?.timeout || 5000;
  const interval = options?.interval || 100;
  const message = options?.message || 'Condition not met';

  const start = Date.now();

  while (Date.now() - start < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout: ${message}`);
}

/**
 * Retry function until it succeeds
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options?: {
    retries?: number;
    delay?: number;
    backoff?: number;
  }
): Promise<T> {
  const retries = options?.retries || 3;
  const delay = options?.delay || 1000;
  const backoff = options?.backoff || 2;

  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve =>
          setTimeout(resolve, delay * Math.pow(backoff, i))
        );
      }
    }
  }

  throw lastError!;
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

// ============================================================================
// GLOBAL TEST SETUP - Initialize all controllers
// ============================================================================

/**
 * Setup bulletproof test environment
 */
export function setupTestEnvironment(): void {
  // Freeze time for determinism
  TimeController.freeze('2025-01-01T00:00:00.000Z');

  // Seed random for determinism
  RandomController.seed(12345);

  // Clear network mocks
  NetworkController.clear();

  // Reset database
  DatabaseController.reset();

  // Reset file system
  FileSystemController.reset();

  // Clear performance metrics
  PerformanceMonitor.clear();
}

/**
 * Teardown test environment
 */
export function teardownTestEnvironment(): void {
  TimeController.restore();
  RandomController.restore();
  NetworkController.clear();
  DatabaseController.reset();
  FileSystemController.reset();
  PerformanceMonitor.clear();
}

// ============================================================================
// JEST/VITEST SETUP HOOKS
// ============================================================================

// Auto-setup for each test
beforeEach(() => {
  setupTestEnvironment();
});

// Auto-teardown after each test
afterEach(() => {
  teardownTestEnvironment();
});

// Export everything for use in tests
export {
  faker,
  waitFor,
  retry,
  createDeferred
};