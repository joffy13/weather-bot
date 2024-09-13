import { MongoClient, Db, Collection } from 'mongodb';
import { GetCoordinatesResponse, Session } from './types';
import * as dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGODB_URL || ''
const dbName = 'weatherBot';
const client = new MongoClient(uri);

let db: Db;
let sessions: Collection<Session>;

const connectDatabase = async () => {
    await client.connect()
    db = client.db(dbName);
    sessions = db.collection('sessions');
};

export const getSession = async (userId: string): Promise<Session | null> => {
    if (!sessions) await connectDatabase();
    return sessions.findOne({ user_id: userId }).then((session) => {
        return session ? { city: session.city, units: session.units, user_id: session.user_id, lat: session.lat, lon: session.lon } : null;
    });
};

export const saveCity = async (id: string, dto: GetCoordinatesResponse): Promise<void> => {
    const session = await getSession(id);
    if (!session) {
        dto.units = 'C';
    }
    await sessions.updateOne(
        { user_id: id },
        { $set: { ...dto } },
        { upsert: true }
    );
};

export const saveUnits = async (id: string, units: string): Promise<void> => {
    if (!sessions) await connectDatabase();
    await sessions.updateOne(
        { user_id: id },
        { $set: { units } }
    );
};

export const isChoosingCity = async (id: string): Promise<boolean> => {
    if (!sessions) await connectDatabase();
    return sessions.findOne({ user_id: id, city: 'choosing' }).then((session) => {
        return !!session;
    });
};
