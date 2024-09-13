import Redis from 'ioredis';
import * as dotenv from 'dotenv'
dotenv.config()

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: +process.env.REDIS_PORT! || 6379
});

export const cacheData = async (city: string, data: any) => {
  await redis.set(city, JSON.stringify(data), 'EX', 3600);
};

export const getCachedData = async (city: string) => {
  const data = await redis.get(city);
  return data ? JSON.parse(data) : null;
};
