export const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const getWeatherMessage = (weatherDto: any) => {
    return `
Погода в ${weatherDto.city} на сегодня:
Температура: ${weatherDto.temp}
Влажность: ${weatherDto.humidity}
Давление: ${weatherDto.pressure}
        `;
}

export const getForecastMessage = (forecastDto: any) => {
    return `Дата: ${forecastDto.date ?? 'Нет данных'}, Днём: ${forecastDto.dayTemp}, Ночью: ${forecastDto.nightTemp}, Условие: ${forecastDto.condition ?? 'Нет данных'}`;
}



export const convertTempUnits = (units: string, temp: string) => {
    return units === 'F'
        ? ((parseFloat(temp) * 9 / 5) + 32).toFixed(1) + ' °F'
        : temp + ' °C';
}