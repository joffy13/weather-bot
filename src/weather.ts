import puppeteer, { Page } from 'puppeteer';
import { getCoordinates } from './geocode';

const YANDEX_WEATHER_URL = 'https://yandex.ru/pogoda/';

const MAX_RETRIES = 3; // Максимальное количество попыток

const fetchPageData = async (page: Page, url: string, selector: string, retries = MAX_RETRIES) => {
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
        await page.waitForSelector(selector, { timeout: 15000 });
    } catch (error) {
        if (retries > 0) {
            console.warn(`Попытка повторного запроса: ${url}. Осталось попыток: ${retries}`);
            return fetchPageData(page, url, selector, retries - 1); // Повторный запрос
        }
        throw error; // Если исчерпаны все попытки, выбрасываем ошибку
    }
};

export const getWeather = async (city: string, units: string) => {
    try {
        const { lat, lon } = await getCoordinates(city);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        console.log(`${YANDEX_WEATHER_URL}?lat=${lat}&lon=${lon}`);

        await fetchPageData(page, `${YANDEX_WEATHER_URL}?lat=${lat}&lon=${lon}`, '.temp__value');

        const weatherData = await page.evaluate((city) => {
            const temp = document.querySelector('.temp__value')?.textContent;
            const humidity = document.querySelector('.fact__humidity .term__value')?.textContent;
            const pressure = document.querySelector('.fact__pressure .term__value')?.textContent;

            return {
                city,
                temp: temp ?? 'Нет данных',
                humidity: humidity ?? 'Нет данных',
                pressure: pressure ?? 'Нет данных'
            };
        }, city);


        await browser.close();
        return weatherData;

    } catch (error) {
        console.error(`Ошибка при получении данных о погоде для города ${city}:`, error);
        throw new Error('Не удалось получить данные о погоде. Пожалуйста, проверьте введенный город или повторите попытку позже.');
    }
};

export const getWeeklyForecast = async (city: string, units: string) => {
    try {
        const { lat, lon } = await getCoordinates(city);
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        console.log(`${YANDEX_WEATHER_URL}?lat=${lat}&lon=${lon}/forecast`);
        await fetchPageData(page, `${YANDEX_WEATHER_URL}?lat=${lat}&lon=${lon}/forecast`, '.forecast-briefly__day-link');

        const forecastData = await page.evaluate(() => {
            const days = Array.from(document.querySelectorAll('.forecast-briefly__day-link'));
            return days.map((day: any) => {
                const date = day.querySelector('.forecast-briefly__date')?.textContent?.trim();
                const dayTemp = day.querySelector('.forecast-briefly__temp_day .temp__value')?.textContent?.trim();
                const nightTemp = day.querySelector('.forecast-briefly__temp_night .temp__value')?.textContent?.trim();
                const condition = day.querySelector('.forecast-briefly__condition')?.textContent?.trim();

                return { date, dayTemp, nightTemp, condition };
            });
        });

        // Оставляем только прогноз на ближайшие 7 дней
        const weeklyForecast = forecastData.slice(0, 7);


        await browser.close();
        return weeklyForecast;

    } catch (error) {
        console.error(`Ошибка при получении прогноза погоды для города ${city}:`, error);
        throw new Error('Не удалось получить прогноз погоды. Пожалуйста, проверьте введенный город или повторите попытку позже.');
    }
};
