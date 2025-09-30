import { logger } from '../../../utils/logger';

export abstract class BaseAgent {
  protected name: string;
  protected description: string;
  protected capabilities: string[];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.capabilities = [];
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getCapabilities(): string[] {
    return this.capabilities;
  }

  abstract processCommand(command: string): Promise<any>;

  protected logAction(action: string, details?: any): void {
    logger.info(`[${this.name}] ${action}`, details);
  }

  protected logError(error: string, details?: any): void {
    logger.error(`[${this.name}] ${error}`, details);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  protected extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was',
      'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'could',
      'shall', 'to', 'of', 'in', 'for', 'with', 'by', 'from', 'about',
    ]);

    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  protected calculateConfidence(factors: number[]): number {
    if (factors.length === 0) return 0;
    const sum = factors.reduce((a, b) => a + b, 0);
    return Math.min(1, sum / factors.length);
  }
}