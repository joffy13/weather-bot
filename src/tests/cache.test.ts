import Redis from 'ioredis-mock';
import { cacheData, getCachedData } from '../cache';

jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

describe('Cache', () => {
  let redis: any;

  beforeAll(() => {
    redis = new Redis();
  });

  it('should cache data', async () => {
    const city = 'testCity';
    const data = { temp: '20' };

    await cacheData(city, data);

    const cachedData = await getCachedData(city);
    expect(cachedData).toEqual(data);
  });
});
