import axios from 'axios';

export async function getCityByCoordinates(latitude: number, longitude: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    try {
        const response = await axios.get(url);
        const address = response.data.address;

        if (address && address.city) {
            return address.city;
        } else if (address && address.town) {
            return address.town;
        } else {
            throw new Error('Город не найден');
        }
    } catch (error) {
        console.error('Ошибка при получении города по координатам:', error);
        throw new Error('Не удалось определить город по координатам');
    }
}