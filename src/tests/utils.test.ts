import { convertTempUnits } from '../utils';

describe('convertTempUnits', () => {
    it('should convert Celsius to Fahrenheit', () => {
        const result = convertTempUnits('F', '25');
        expect(result).toBe('77.0 °F');
    });

    it('should return Celsius if units are C', () => {
        const result = convertTempUnits('C', '25');
        expect(result).toBe('25 °C');
    });
});
