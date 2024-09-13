import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { getSession, saveCity, saveUnits, isChoosingCity } from '../database';
import { GetCoordinatesResponse } from '../types';

let mongoServer: MongoMemoryServer;
let connection: MongoClient;
let db: any;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    connection = await MongoClient.connect(mongoServer.getUri(), {});
    db = await connection.db('weatherBot');
    await db.createCollection('sessions');
}, 30000); // Увеличиваем тайм-аут до 30 секунд

afterAll(async () => {
    await connection.close();
    await mongoServer.stop();
}, 30000); // Увеличиваем тайм-аут до 30 секунд

// Важно: добавьте доступ к коллекции sessions в тестах
beforeEach(async () => {
    await db.collection('sessions').deleteMany({});
});

describe('Database functions', () => {
    const userId = '123456';
    const city = 'TestCity';

    it('should save city', async () => {
        await saveCity(userId, { city } as GetCoordinatesResponse);
        const session = await getSession(userId);
        expect(session?.city).toBe(city);
    });

    it('should save units', async () => {
        const units = 'F';
        await saveUnits(userId, units);
        const session = await getSession(userId);
        expect(session?.units).toBe(units);
    });

    it('should check if city is being chosen', async () => {
        const choosingCity = await isChoosingCity(userId);
        expect(choosingCity).toBe(false);
    });
});
