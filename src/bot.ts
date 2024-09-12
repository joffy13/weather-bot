import { Telegraf, Markup, Context } from 'telegraf';
import { getWeather, getWeeklyForecast } from './weather'; // Функции для получения погоды
import { getSession, saveCity, saveUnits, isChoosingCity } from './database'; // БД функции
import dotenv from 'dotenv';
import { getCityByCoordinates } from './get-city-by-coordinates';
import { getCoordinates } from './geocode';
import { cacheData, getCachedData } from './cache';
import { convertTempUnits, getWeatherMessage } from './utils';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

function showMainMenu(ctx: Context) {
    ctx.reply('Выберите действие:', Markup.keyboard([
        ['Показать погоду на сегодня', 'Показать погоду на неделю'],
        ['Сменить единицу измерения'],
        ['Сменить город']
    ]).resize());
}

bot.start(async (ctx) => {
    try {
        const session = await getSession(ctx.from.id.toString());
        console.log(session)
        if (!session) {
            await saveCity(ctx.from.id.toString(), { city: 'choosing' });
            ctx.reply('Пожалуйста, введите название города или отправьте ваше местоположение.', Markup.keyboard([
                [{ text: 'Отправить местоположение', request_location: true }],
            ]).resize());
        } else {
            return showMainMenu(ctx);
        }
    } catch (error) {
        console.error('Ошибка при старте бота:', error);
        ctx.reply('Произошла ошибка. Пожалуйста, попробуйте позже.');
    }
});

bot.on('location', async (ctx) => {
    try {
        const { latitude, longitude } = ctx.message.location;
        const city = await getCityByCoordinates(latitude, longitude);

        if (!city) {
            ctx.reply('Не удалось определить город по вашим координатам. Пожалуйста, попробуйте еще раз.');
            return;
        }

        await saveCity(ctx.from.id.toString(), { city, lat: latitude.toString(), lon: longitude.toString() });
        ctx.reply(`Ваш город: ${city}. Теперь выберите единицы измерения.`, Markup.keyboard(['Цельсий', 'Фаренгейт']).resize());
    } catch (error) {
        console.error('Ошибка при получении города по координатам:', error);
        ctx.reply('Произошла ошибка при определении вашего города. Пожалуйста, попробуйте еще раз.');
    }
});

bot.hears(['Ввести город', 'Сменить город'], async (ctx) => {
    try {
        await saveCity(ctx.from.id.toString(), { city: 'choosing' });
        ctx.reply('Пожалуйста, введите название города или отправьте ваше местоположение.', Markup.keyboard([
            [{ text: 'Отправить местоположение', request_location: true }],
        ]).resize());
    } catch (error) {
        console.error('Ошибка при вводе города:', error);
        ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    }
});


bot.hears(['Цельсий', 'Фаренгейт'], async (ctx) => {
    try {
        const units = ctx.message.text === 'Цельсий' ? 'C' : 'F';
        await saveUnits(ctx.from.id.toString(), units);
        showMainMenu(ctx);
    } catch (error) {
        console.error('Ошибка при выборе единиц измерения:', error);
        ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    }
});


bot.hears('Показать погоду на сегодня', async (ctx) => {
    try {
        const session = await getSession(ctx.from.id.toString());
        if (!session || !session.city || !session.units) {
            ctx.reply('Сначала установите город и единицы измерения.');
            return;
        }
        const cache = await getCachedData(`${session.city}:weather`)
        let weatherMessage
        if (!cache) {
            ctx.reply('Подождите, это может занять некоторое время');

            const weather = await getWeather(session.city, session.units);

            cacheData(`${session.city}:weather`, weather)
            weather.temp = convertTempUnits(session.units, weather.temp)
            weatherMessage = getWeatherMessage(weather)

        } else {
            console.log(cache)
            cache.temp = convertTempUnits(session.units, cache.temp)
            weatherMessage = getWeatherMessage(cache)
        }
        ctx.reply(weatherMessage);
        showMainMenu(ctx)
    } catch (error) {
        console.error('Ошибка при получении погоды на сегодня:', error);
        ctx.reply('Произошла ошибка при получении погоды. Пожалуйста, попробуйте позже.');
    }
});
bot.hears('Показать погоду на неделю', async (ctx) => {
    try {
        const session = await getSession(ctx.from.id.toString());
        if (!session || !session.city || !session.units) {
            ctx.reply('Сначала установите город и единицы измерения.');
            return;
        }

        const cache = await getCachedData(`${session.city}:forecast`);
        let weeklyForecast: any[];
        if (!cache) {
            ctx.reply('Подождите, это может занять некоторое время');

            weeklyForecast = await getWeeklyForecast(session.city, session.units);
            cacheData(`${session.city}:forecast`, weeklyForecast);

        } else {
            weeklyForecast = cache;
        }
        const res = weeklyForecast.map(element => {
            return {
                date: element.date,
                dayTemp: convertTempUnits(session.units, element.dayTemp),
                nightTemp: convertTempUnits(session.units, element.nightTemp),
                condition: element.condition
            };
        });
        // Функция для форматирования прогноза
        const formatForecast = (forecast: any) => {
            return `Дата: ${forecast.date}\nТемпература днём: ${forecast.dayTemp}\nТемпература ночью: ${forecast.nightTemp}\nСостояние: ${forecast.condition}`;
        };

        // Форматируем каждый элемент прогноза и объединяем их в строку
        const forecastText = res.map(formatForecast).join('\n\n');

        ctx.reply(`Прогноз погоды в ${session.city} на неделю:\n\n${forecastText}`);
        showMainMenu(ctx);
    } catch (error) {
        console.error('Ошибка при получении прогноза погоды на неделю:', error);
        ctx.reply('Произошла ошибка при получении прогноза. Пожалуйста, попробуйте позже.');
    }
});

// bot.hears('Сменить город', (ctx) => {
//     try {
//         ctx.reply('Пожалуйста, введите новый город.', Markup.keyboard([
//             [{ text: 'Отправить местоположение', request_location: true }],
//             ['Ввести город']
//         ]).resize());
//     } catch (error) {
//         console.error('Ошибка при смене города:', error);
//         ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
//     }
// });

bot.hears('Сменить единицу измерения', (ctx) => {
    try {
        ctx.reply('Выберите единицу измерения.', Markup.keyboard(['Цельсий', 'Фаренгейт']).resize());
    } catch (error) {
        console.error('Ошибка при смене единицы измерения:', error);
        ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    }
});

bot.hears('Вернуться назад', (ctx) => {
    showMainMenu(ctx);
});

bot.on('text', async (ctx) => {
    try {
        const isCityBeingChosen = await isChoosingCity(ctx.from.id.toString());

        if (isCityBeingChosen) {
            const cordinatesResponse = await getCoordinates(ctx.message.text.trim())

            await saveCity(ctx.from.id.toString(), cordinatesResponse);
            const session = await getSession(ctx.from.id.toString())
            ctx.reply(`Ваш город: ${session?.city}`);
            showMainMenu(ctx)
        } else {
            console.log('Неопознанный ввод:', ctx.message.text);
        }
    } catch (error) {
        console.error('Ошибка при обработке текста:', error);
        ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    }
});



bot.launch().catch((error) => {
    console.error('Ошибка при запуске бота:', error);
});
