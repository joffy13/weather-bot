import Redis from 'ioredis';

const redis = new Redis();

export const cacheData = async (city: string, data: any) => {
  await redis.set(city, JSON.stringify(data), 'EX', 3600); // Кэшируем на 1 час
};

export const getCachedData = async (city: string) => {
  const data = await redis.get(city);
  return data ? JSON.parse(data) : null;
};
