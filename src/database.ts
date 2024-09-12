import { MongoClient, Db, Collection } from 'mongodb';
import { GetCoordinatesResponse, Session } from './types';
import * as dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGODB_URL || ''
console.log('uri', uri)
const dbName = 'weatherBot';
const client = new MongoClient(uri);

let db: Db;
let sessions: Collection<Session>;

client.connect().then(() => {
    db = client.db(dbName);
    sessions = db.collection('sessions');
    console.log("Connected to MongoDB");
}).catch((err: any) => {
    console.error('MongoDB connection error:', err);
});

export const getSession = (userId: string): Promise<Session | null> => {
    return sessions.findOne({ user_id: userId }).then((session) => {
        return session ? { city: session.city, units: session.units, user_id: session.user_id, lat: session.lat, lon: session.lon } : null;
    });
};

export const saveCity = async (id: string, dto: GetCoordinatesResponse): Promise<void> => {
    const session = await getSession(id)
    if (!session) {
        dto.units = 'C'
    }
    return sessions.updateOne(
        { user_id: id },
        { $set: { ...dto } },
        { upsert: true }
    ).then(() => { });
};

export const saveUnits = (id: string, units: string): Promise<void> => {
    return sessions.updateOne(
        { user_id: id },
        { $set: { units } }
    ).then(() => { });
};

export const isChoosingCity = (id: string): Promise<boolean> => {
    return sessions.findOne({ user_id: id, city: 'choosing' }).then((session) => {
        return !!session;
    });
};
