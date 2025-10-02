// Mock Redis implementation for development when Redis is not available
export class MockRedis {
  private store = new Map<string, { value: string; expires?: number }>();

  async ping(): Promise<string> {
    return 'PONG';
  }

  async set(key: string, value: string): Promise<string> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    const expires = Date.now() + (seconds * 1000);
    this.store.set(key, { value, expires });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    keys.forEach(key => {
      if (this.store.has(key)) {
        this.store.delete(key);
        deleted++;
      }
    });
    return deleted;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return 0;
    }
    
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    if (!item.expires) return -1;
    
    const remaining = Math.ceil((item.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.store.get(key);
    if (!item) return 0;
    
    const expires = Date.now() + (seconds * 1000);
    this.store.set(key, { ...item, expires });
    return 1;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, value.toString());
    return value;
  }

  async incrby(key: string, increment: number): Promise<number> {
    const current = await this.get(key);
    const value = current ? parseInt(current, 10) + increment : increment;
    await this.set(key, value.toString());
    return value;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  async keys(pattern: string): Promise<string[]> {
    // Simple pattern matching for *
    if (pattern === '*') {
      return Array.from(this.store.keys());
    }
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  async dbsize(): Promise<number> {
    return this.store.size;
  }

  async info(_section?: string): Promise<string> {
    return `# Memory\nused_memory_human:${Math.round(this.store.size * 100 / 1024)}K\n`;
  }

  pipeline() {
    const commands: Array<() => Promise<any>> = [];
    
    return {
      setex: (key: string, seconds: number, value: string) => {
        commands.push(() => this.setex(key, seconds, value));
        return this;
      },
      exec: async () => {
        const results = await Promise.all(commands.map(cmd => cmd().catch(err => [err, null])));
        return results.map(result => Array.isArray(result) ? result : [null, result]);
      }
    };
  }

  on(event: string, callback: Function) {
    // Mock event handlers
    if (event === 'connect') {
      setTimeout(() => callback(), 10);
    } else if (event === 'ready') {
      setTimeout(() => callback(), 20);
    }
  }
}