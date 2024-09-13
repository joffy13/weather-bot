import axios from 'axios';

const url = 'https://nominatim.openstreetmap.org/search';

export const getCoordinates = async (city: string) => {
    try {
        const response = await axios.get(url, {
            params: {
                q: city,
                format: 'json',
                limit: 1,
            },
        });
        if (response.data.length === 0) {
            throw new Error('Город не найден');
        }

        const { lat, lon, name } = response.data[0];

        return { lat, lon, city: name };
    } catch (error) {
        throw new Error('Ошибка при получении координат');
    }
};
