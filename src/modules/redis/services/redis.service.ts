import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import authConfig from '@config/auth.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    const { host, port, password, username } = authConfig().redis;

    const options: RedisOptions = {
      host,
      port: port ? Number(port) : 6379,
      ...(password ? { password } : {}),
      ...(username ? { username } : {}),
      connectTimeout: 5000,
      lazyConnect: true,
      enableOfflineQueue: false,
    };

    this.client = new Redis(options);

    this.client.connect().catch(error => {
      this.logger.warn(`Redis connection skipped: ${error.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}