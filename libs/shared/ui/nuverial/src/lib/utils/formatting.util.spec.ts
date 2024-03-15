import { formatValue, pipeValue } from './formatting.util';

describe('formatting', () => {
  describe('pipeValue', () => {
    it('should return a formatted date value', () => {
      const value = 'February 1, 2022';
      const formatType = 'date';
      const datePipeOptions = { format: 'shortDate', locale: 'en-US', timezone: 'UTC' };
      const result = pipeValue({ value, formatType, datePipeOptions });

      expect(result).toEqual('2/1/22');
    });

    it('should return a formatted time value', () => {
      const value = '2020-05-12T23:50:21.817Z';
      const formatType = 'time';
      const datePipeOptions = { format: 'shortTime', locale: 'en-US', timezone: 'UTC' };
      const result = pipeValue({ value, formatType, datePipeOptions });

      expect(result).toEqual('11:50 PM');
    });

    it('should return a formatted number value', () => {
      const value = '2345.67';
      const formatType = 'number';
      const decimalPipeOptions = { digitsInfo: '1.2-2', locale: 'en-US' };
      const result = pipeValue({ value, formatType, decimalPipeOptions });

      expect(result).toEqual('2,345.67');
    });

    it('should return a formatted currency value', () => {
      const value = '2345.67';
      const formatType = 'currency';
      const currencyPipeOptions = { currency: '$', locale: 'en-US' };
      const result = pipeValue({ value, formatType, currencyPipeOptions });

      expect(result).toEqual('$2,345.67');
    });
  });

  describe('formatValue', () => {
    it('should return a formatted value', () => {
      const prefix = 'prefix ';
      const suffix = ' suffix';
      const value = '2345.67';
      const formatType = 'text';
      const result = formatValue({ prefix, suffix, value, formatType });

      expect(result).toEqual('prefix 2345.67 suffix');
    });
  });
});
