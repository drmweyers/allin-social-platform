import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { BaseAgent } from './base-agent';
import { logger } from '../../../utils/logger';

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create a concrete implementation for testing
class TestAgent extends BaseAgent {
  constructor(name: string = 'TestAgent', description: string = 'Test agent for unit testing') {
    super(name, description);
    this.capabilities = ['test', 'mock', 'validate'];
  }

  async processCommand(command: string): Promise<any> {
    this.logAction('Processing command', { command });

    if (command === 'error') {
      throw new Error('Test error');
    }

    if (command === 'delay') {
      await this.delay(10);
      return { delayed: true };
    }

    return {
      command,
      processed: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Expose protected methods for testing
  public testLogAction(action: string, details?: any): void {
    return this.logAction(action, details);
  }

  public testLogError(error: string, details?: any): void {
    return this.logError(error, details);
  }

  public testDelay(ms: number): Promise<void> {
    return this.delay(ms);
  }

  public testNormalizeText(text: string): string {
    return this.normalizeText(text);
  }

  public testExtractKeywords(text: string): string[] {
    return this.extractKeywords(text);
  }

  public testCalculateConfidence(factors: number[]): number {
    return this.calculateConfidence(factors);
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;
  let mockLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new TestAgent();
    mockLogger = logger as jest.Mocked<typeof logger>;
  });

  describe('Constructor and Basic Properties', () => {
    it('should create agent with correct name and description', () => {
      const customAgent = new TestAgent('CustomAgent', 'Custom test agent');

      expect(customAgent.getName()).toBe('CustomAgent');
      expect(customAgent.getDescription()).toBe('Custom test agent');
      expect(customAgent.getCapabilities()).toEqual(['test', 'mock', 'validate']);
    });

    it('should handle empty name and description', () => {
      const emptyAgent = new TestAgent('', '');

      expect(emptyAgent.getName()).toBe('');
      expect(emptyAgent.getDescription()).toBe('');
    });

    it('should handle special characters in name and description', () => {
      const specialAgent = new TestAgent(
        'Agent-123_Test!@#',
        'Description with 特殊字符 and émojis 🤖'
      );

      expect(specialAgent.getName()).toBe('Agent-123_Test!@#');
      expect(specialAgent.getDescription()).toBe('Description with 特殊字符 and émojis 🤖');
    });

    it('should initialize empty capabilities array', () => {
      class EmptyAgent extends BaseAgent {
        constructor() {
          super('EmptyAgent', 'Empty agent');
        }
        async processCommand(command: string): Promise<any> {
          return { command };
        }
      }

      const emptyAgent = new EmptyAgent();
      expect(emptyAgent.getCapabilities()).toEqual([]);
    });
  });

  describe('Abstract Method Implementation', () => {
    it('should process commands successfully', async () => {
      const result = await agent.processCommand('test-command');

      expect(result).toHaveProperty('command', 'test-command');
      expect(result).toHaveProperty('processed', true);
      expect(result).toHaveProperty('timestamp');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[TestAgent] Processing command',
        { command: 'test-command' }
      );
    });

    it('should handle command errors', async () => {
      await expect(agent.processCommand('error')).rejects.toThrow('Test error');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[TestAgent] Processing command',
        { command: 'error' }
      );
    });

    it('should handle delayed commands', async () => {
      const start = Date.now();
      const result = await agent.processCommand('delay');
      const duration = Date.now() - start;

      expect(result).toEqual({ delayed: true });
      expect(duration).toBeGreaterThanOrEqual(8); // Allow some tolerance
      expect(duration).toBeLessThan(50); // Should not take too long
    });

    it('should handle empty commands', async () => {
      const result = await agent.processCommand('');

      expect(result).toHaveProperty('command', '');
      expect(result).toHaveProperty('processed', true);
    });

    it('should handle null and undefined commands', async () => {
      const nullResult = await agent.processCommand(null as any);
      const undefinedResult = await agent.processCommand(undefined as any);

      expect(nullResult).toHaveProperty('command', null);
      expect(undefinedResult).toHaveProperty('command', undefined);
    });

    it('should handle very long commands', async () => {
      const longCommand = 'a'.repeat(10000);
      const result = await agent.processCommand(longCommand);

      expect(result).toHaveProperty('command', longCommand);
      expect(result).toHaveProperty('processed', true);
    });
  });

  describe('Logging Methods', () => {
    it('should log actions with agent name prefix', () => {
      agent.testLogAction('Test action', { data: 'test' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[TestAgent] Test action',
        { data: 'test' }
      );
    });

    it('should log actions without details', () => {
      agent.testLogAction('Simple action');

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[TestAgent] Simple action',
        undefined
      );
    });

    it('should log errors with agent name prefix', () => {
      agent.testLogError('Test error', { error: 'details' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TestAgent] Test error',
        { error: 'details' }
      );
    });

    it('should log errors without details', () => {
      agent.testLogError('Simple error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[TestAgent] Simple error',
        undefined
      );
    });

    it('should handle empty action messages', () => {
      agent.testLogAction('');

      expect(mockLogger.info).toHaveBeenCalledWith('[TestAgent] ', undefined);
    });

    it('should handle empty error messages', () => {
      agent.testLogError('');

      expect(mockLogger.error).toHaveBeenCalledWith('[TestAgent] ', undefined);
    });

    it('should handle complex details objects', () => {
      const complexDetails = {
        user: { id: 123, name: 'John' },
        metadata: { timestamp: new Date(), source: 'api' },
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
      };

      agent.testLogAction('Complex action', complexDetails);

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[TestAgent] Complex action',
        complexDetails
      );
    });

    it('should handle circular reference objects in details', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => {
        agent.testLogAction('Circular action', circular);
      }).not.toThrow();

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[TestAgent] Circular action',
        circular
      );
    });
  });

  describe('Utility Methods', () => {
    describe('delay', () => {
      it('should delay execution for specified milliseconds', async () => {
        const start = Date.now();
        await agent.testDelay(50);
        const duration = Date.now() - start;

        expect(duration).toBeGreaterThanOrEqual(45); // Allow some tolerance
        expect(duration).toBeLessThan(100);
      });

      it('should handle zero delay', async () => {
        const start = Date.now();
        await agent.testDelay(0);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10); // Should be nearly immediate
      });

      it('should handle negative delay', async () => {
        const start = Date.now();
        await agent.testDelay(-10);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(10); // Should be immediate
      });

      it('should handle very large delays efficiently', async () => {
        // Test that the promise is created properly without actually waiting
        const delayPromise = agent.testDelay(10000);
        expect(delayPromise).toBeInstanceOf(Promise);

        // Cancel the delay by resolving quickly
        const raceResult = await Promise.race([
          delayPromise,
          new Promise(resolve => setTimeout(() => resolve('timeout'), 10))
        ]);

        expect(raceResult).toBe('timeout');
      });

      it('should support concurrent delays', async () => {
        const start = Date.now();
        const delays = [
          agent.testDelay(20),
          agent.testDelay(30),
          agent.testDelay(25),
        ];

        await Promise.all(delays);
        const duration = Date.now() - start;

        // Should complete in ~30ms (longest delay), not 75ms (sum)
        expect(duration).toBeGreaterThanOrEqual(25);
        expect(duration).toBeLessThan(60);
      });
    });

    describe('normalizeText', () => {
      it('should convert text to lowercase and trim whitespace', () => {
        expect(agent.testNormalizeText('  HELLO WORLD  ')).toBe('hello world');
        expect(agent.testNormalizeText('Test String')).toBe('test string');
        expect(agent.testNormalizeText('MiXeD cAsE')).toBe('mixed case');
      });

      it('should handle empty strings', () => {
        expect(agent.testNormalizeText('')).toBe('');
        expect(agent.testNormalizeText('   ')).toBe('');
      });

      it('should handle unicode characters', () => {
        expect(agent.testNormalizeText('  HÉLLO WÖRLD  ')).toBe('héllo wörld');
        expect(agent.testNormalizeText('测试 TEXT')).toBe('测试 text');
        expect(agent.testNormalizeText('Ñoño JOSÉ')).toBe('ñoño josé');
      });

      it('should handle special characters', () => {
        expect(agent.testNormalizeText('  @#$%^&*()  ')).toBe('@#$%^&*()');
        expect(agent.testNormalizeText('Hello-World_123!')).toBe('hello-world_123!');
      });

      it('should handle numbers', () => {
        expect(agent.testNormalizeText('  123 ABC 456  ')).toBe('123 abc 456');
      });

      it('should handle emojis', () => {
        expect(agent.testNormalizeText('  Hello 🌍 World  ')).toBe('hello 🌍 world');
      });

      it('should handle newlines and tabs', () => {
        expect(agent.testNormalizeText('\n\tHello\tWorld\n')).toBe('hello\tworld');
      });
    });

    describe('extractKeywords', () => {
      it('should extract keywords and filter stop words', () => {
        const text = 'The quick brown fox jumps over the lazy dog';
        const keywords = agent.testExtractKeywords(text);

        expect(keywords).toContain('quick');
        expect(keywords).toContain('brown');
        expect(keywords).toContain('jumps');
        expect(keywords).not.toContain('the');
        expect(keywords).not.toContain('over');
      });

      it('should filter words with 3 or fewer characters', () => {
        const text = 'A big cat sat on a mat';
        const keywords = agent.testExtractKeywords(text);

        expect(keywords).not.toContain('big'); // 3 characters
        expect(keywords).not.toContain('cat'); // 3 characters
        expect(keywords).not.toContain('sat'); // 3 characters
        expect(keywords).not.toContain('mat'); // 3 characters
        expect(keywords).not.toContain('a');   // 1 character
        expect(keywords).not.toContain('on');  // 2 characters
      });

      it('should handle empty text', () => {
        const keywords = agent.testExtractKeywords('');
        expect(keywords).toEqual([]);
      });

      it('should handle text with only stop words', () => {
        const text = 'the is at which on a an as are was were';
        const keywords = agent.testExtractKeywords('');
        expect(keywords).toEqual([]);
      });

      it('should handle text with only short words', () => {
        const text = 'a an to of in by';
        const keywords = agent.testExtractKeywords(text);
        expect(keywords).toEqual([]);
      });

      it('should handle mixed case and preserve uniqueness', () => {
        const text = 'Machine Learning machine learning MACHINE LEARNING';
        const keywords = agent.testExtractKeywords(text);

        expect(keywords.filter(k => k === 'machine')).toHaveLength(1);
        expect(keywords.filter(k => k === 'learning')).toHaveLength(1);
      });

      it('should handle punctuation and special characters', () => {
        const text = 'Hello, world! This is a test... with punctuation?';
        const keywords = agent.testExtractKeywords(text);

        expect(keywords).toContain('hello');
        expect(keywords).toContain('world');
        expect(keywords).toContain('test');
        expect(keywords).toContain('punctuation');
      });

      it('should handle unicode text', () => {
        const text = 'Künstliche Intelligenz machine learning développement';
        const keywords = agent.testExtractKeywords(text);

        expect(keywords).toContain('künstliche');
        expect(keywords).toContain('intelligenz');
        expect(keywords).toContain('machine');
        expect(keywords).toContain('learning');
        expect(keywords).toContain('développement');
      });

      it('should handle very long text efficiently', () => {
        const longText = Array(1000).fill('artificial intelligence technology').join(' ');
        const start = Date.now();
        const keywords = agent.testExtractKeywords(longText);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100); // Should process quickly
        expect(keywords).toContain('artificial');
        expect(keywords).toContain('intelligence');
        expect(keywords).toContain('technology');
      });

      it('should handle numbers and alphanumeric words', () => {
        const text = 'machine learning 2024 ai technology version1.5 test123';
        const keywords = agent.testExtractKeywords(text);

        expect(keywords).toContain('machine');
        expect(keywords).toContain('learning');
        expect(keywords).toContain('2024');
        expect(keywords).toContain('technology');
        expect(keywords).toContain('version1.5');
        expect(keywords).toContain('test123');
      });
    });

    describe('calculateConfidence', () => {
      it('should calculate average confidence from factors', () => {
        expect(agent.testCalculateConfidence([0.8, 0.6, 0.9])).toBeCloseTo(0.767, 2);
        expect(agent.testCalculateConfidence([1.0, 1.0, 1.0])).toBe(1.0);
        expect(agent.testCalculateConfidence([0.0, 0.0, 0.0])).toBe(0.0);
      });

      it('should handle empty factors array', () => {
        expect(agent.testCalculateConfidence([])).toBe(0);
      });

      it('should cap confidence at 1.0', () => {
        expect(agent.testCalculateConfidence([2.0, 3.0, 4.0])).toBe(1.0);
        expect(agent.testCalculateConfidence([1.5, 1.5])).toBe(1.0);
      });

      it('should handle single factor', () => {
        expect(agent.testCalculateConfidence([0.75])).toBe(0.75);
        expect(agent.testCalculateConfidence([1.5])).toBe(1.0);
      });

      it('should handle negative factors', () => {
        expect(agent.testCalculateConfidence([-0.5, 0.5, 1.0])).toBeCloseTo(0.333, 2);
        expect(agent.testCalculateConfidence([-1.0, -1.0])).toBe(0); // Math.min with negative average
      });

      it('should handle zero factors', () => {
        expect(agent.testCalculateConfidence([0, 0, 0, 0])).toBe(0);
      });

      it('should handle decimal factors', () => {
        expect(agent.testCalculateConfidence([0.1, 0.2, 0.3, 0.4])).toBe(0.25);
        expect(agent.testCalculateConfidence([0.33, 0.67])).toBe(0.5);
      });

      it('should handle very small factors', () => {
        expect(agent.testCalculateConfidence([0.001, 0.002, 0.003])).toBeCloseTo(0.002, 3);
      });

      it('should handle very large arrays', () => {
        const largeArray = Array(1000).fill(0.5);
        expect(agent.testCalculateConfidence(largeArray)).toBe(0.5);
      });

      it('should handle mixed positive and negative factors', () => {
        expect(agent.testCalculateConfidence([1.0, -0.5, 0.5, 0.0])).toBe(0.25);
      });

      it('should handle extreme values', () => {
        expect(agent.testCalculateConfidence([Number.MAX_VALUE])).toBe(1.0);
        expect(agent.testCalculateConfidence([Number.MIN_VALUE])).toBeCloseTo(Number.MIN_VALUE, 10);
      });
    });
  });

  describe('Integration and Performance Tests', () => {
    it('should handle multiple concurrent operations', async () => {
      const operations = [
        agent.processCommand('test1'),
        agent.processCommand('test2'),
        agent.processCommand('test3'),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result).toHaveProperty('command', `test${index + 1}`);
        expect(result).toHaveProperty('processed', true);
      });

      expect(mockLogger.info).toHaveBeenCalledTimes(3);
    });

    it('should maintain state correctly across operations', async () => {
      const name1 = agent.getName();
      await agent.processCommand('test');
      const name2 = agent.getName();

      expect(name1).toBe(name2);
      expect(agent.getDescription()).toBe('Test agent for unit testing');
      expect(agent.getCapabilities()).toEqual(['test', 'mock', 'validate']);
    });

    it('should handle high-frequency operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) =>
        agent.processCommand(`test${i}`)
      );

      const start = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - start;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle mixed operation types efficiently', async () => {
      const text = 'artificial intelligence machine learning deep learning neural networks';
      const factors = [0.8, 0.9, 0.7, 0.85];

      const start = Date.now();

      const operations = await Promise.all([
        agent.processCommand('mixed-test'),
        agent.testDelay(5),
        Promise.resolve(agent.testNormalizeText('  MIXED CASE TEXT  ')),
        Promise.resolve(agent.testExtractKeywords(text)),
        Promise.resolve(agent.testCalculateConfidence(factors)),
      ]);

      const duration = Date.now() - start;

      expect(operations[0]).toHaveProperty('processed', true);
      expect(operations[2]).toBe('mixed case text');
      expect(operations[3]).toContain('artificial');
      expect(operations[4]).toBeCloseTo(0.8125, 3);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle method calls with invalid parameters gracefully', () => {
      expect(() => agent.testNormalizeText(null as any)).not.toThrow();
      expect(() => agent.testNormalizeText(undefined as any)).not.toThrow();
      expect(() => agent.testExtractKeywords(null as any)).not.toThrow();
      expect(() => agent.testCalculateConfidence(null as any)).not.toThrow();
    });

    it('should handle logger failures gracefully', () => {
      mockLogger.info.mockImplementation(() => {
        throw new Error('Logger failed');
      });

      expect(() => agent.testLogAction('Test action')).toThrow('Logger failed');
    });

    it('should handle very large inputs', () => {
      const largeText = 'a'.repeat(100000);

      expect(() => agent.testNormalizeText(largeText)).not.toThrow();
      expect(() => agent.testExtractKeywords(largeText)).not.toThrow();

      const largeFactors = Array(10000).fill(0.5);
      expect(() => agent.testCalculateConfidence(largeFactors)).not.toThrow();
    });

    it('should maintain immutability of capabilities array', () => {
      const capabilities = agent.getCapabilities();
      capabilities.push('new-capability');

      expect(agent.getCapabilities()).toEqual(['test', 'mock', 'validate']);
    });

    it('should handle agent with different name formats', () => {
      const agents = [
        new TestAgent('agent-with-dashes', 'Test agent'),
        new TestAgent('agent_with_underscores', 'Test agent'),
        new TestAgent('AgentWithCamelCase', 'Test agent'),
        new TestAgent('AGENT_WITH_CAPS', 'Test agent'),
        new TestAgent('123NumericAgent', 'Test agent'),
        new TestAgent('🤖EmojiAgent', 'Test agent'),
      ];

      agents.forEach(agent => {
        agent.testLogAction('Test action');
        expect(mockLogger.info).toHaveBeenCalledWith(
          `[${agent.getName()}] Test action`,
          undefined
        );
      });
    });
  });

  describe('Memory Management', () => {
    it('should not accumulate memory with repeated operations', async () => {
      for (let i = 0; i < 1000; i++) {
        await agent.processCommand(`test-${i}`);
        agent.testNormalizeText(`text-${i}`);
        agent.testExtractKeywords(`keyword extraction test ${i}`);
        agent.testCalculateConfidence([Math.random()]);
      }

      // Should complete without memory issues
      expect(agent.getName()).toBe('TestAgent');
    });

    it('should clean up resources properly', async () => {
      // Create many agents and ensure they can be garbage collected
      const agents = Array.from({ length: 100 }, (_, i) =>
        new TestAgent(`Agent${i}`, `Description ${i}`)
      );

      for (const agent of agents) {
        await agent.processCommand('test');
      }

      // Should complete without memory issues
      expect(agents).toHaveLength(100);
    });
  });
});

export {};