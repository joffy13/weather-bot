import puppeteer from 'puppeteer';
import { getWeather, getWeeklyForecast } from '../weather';
import { getCoordinates } from '../geocode';

jest.mock('puppeteer');
jest.mock('../geocode');

const mockedPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;
const mockedGetCoordinates = getCoordinates as jest.MockedFunction<typeof getCoordinates>;

describe('Weather', () => {
    let browser: any;
    let page: any;

    beforeAll(() => {
        browser = {
            newPage: jest.fn(),
            close: jest.fn(),
        };
        page = {
            goto: jest.fn(),
            waitForSelector: jest.fn(),
            evaluate: jest.fn(),
            close: jest.fn(),
        };

        mockedPuppeteer.launch.mockResolvedValue(browser);
        browser.newPage.mockResolvedValue(page);

        mockedGetCoordinates.mockResolvedValue({
            lat: '55.7558',
            lon: '37.6173',
            city: 'Moscow',
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should get today\'s weather', async () => {
        page.evaluate.mockResolvedValue({
            city: 'Moscow',
            temp: '20',
            humidity: '60%',
            pressure: '1016',
        });

        const weather = await getWeather('Moscow', 'C');
        expect(weather).toEqual({
            city: 'Moscow',
            temp: '20',
            humidity: '60%',
            pressure: '1016',
        });
    });

    it('should get weekly forecast', async () => {
        page.evaluate.mockResolvedValue([
            {
                date: '2023-09-22',
                dayTemp: '20',
                nightTemp: '10',
                condition: 'Sunny',
            },
            {
                date: '2023-09-23',
                dayTemp: '22',
                nightTemp: '12',
                condition: 'Cloudy',
            },
        ]);

        const forecast = await getWeeklyForecast('Moscow', 'C');
        expect(forecast).toEqual([
            {
                date: '2023-09-22',
                dayTemp: '20',
                nightTemp: '10',
                condition: 'Sunny',
            },
            {
                date: '2023-09-23',
                dayTemp: '22',
                nightTemp: '12',
                condition: 'Cloudy',
            },
        ]);
    });
});
