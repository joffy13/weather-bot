import { Context } from 'telegraf';


export interface WeatherData {
    temp: string;
    humidity: string;
    pressure: string;
}

export interface Session {
    units: string;
    city: string
    user_id: string
    lat: string
    lon: string
}

export interface MyContext extends Context {
    session: Session;
}

export interface GetCoordinatesResponse {
    lat?: string
    lon?: string
    city?: string
    units?: string
}