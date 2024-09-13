import axios from 'axios';
import { getCoordinates } from '../geocode';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Geocode', () => {
  it('should get coordinates for a city', async () => {
    const city = 'Moscow';

    mockedAxios.get.mockResolvedValue({
      data: [
        {
          lat: '55.7558',
          lon: '37.6173',
          name: 'Moscow',
        },
      ],
    });

    const coordinates = await getCoordinates(city);
    expect(coordinates).toEqual({
      lat: '55.7558',
      lon: '37.6173',
      city: 'Moscow',
    });
  });

  it('should throw an error for an unknown city', async () => {
    const city = 'UnknownCity';

    mockedAxios.get.mockResolvedValue({ data: [] });

    await expect(getCoordinates(city)).rejects.toThrow('Ошибка при получении координат');
  });
});
