import { formatCurrency, formatDate, formatNumber } from '@angular/common';
import { CurrencyPipeOptions, DatePipeOptions, DecimalPipeOptions, FormatOptions } from '../components';

export function pipeDate(value: string, datePipeOptions: DatePipeOptions): string {
  const { format, locale, timezone } = datePipeOptions;

  return formatDate(Date.parse(value.toString()), format || 'longDate', locale || 'en-US', timezone);
}

export function pipeNumber(value: number, decimalPipeOptions: DecimalPipeOptions): string {
  const { digitsInfo, locale } = decimalPipeOptions;

  return formatNumber(value, locale || 'en-US', digitsInfo);
}

export function pipeCurrency(value: number, currencyPipeOptions: CurrencyPipeOptions): string {
  const { currency, currencyCode, digitsInfo, locale } = currencyPipeOptions;

  return formatCurrency(value, locale || 'en-US', currency || 'USD', currencyCode, digitsInfo);
}

export function pipeValue(options: FormatOptions): string {
  const { value, formatType, currencyPipeOptions, datePipeOptions, decimalPipeOptions } = options;
  try {
    switch (formatType) {
      case 'date':
      case 'time': {
        if (!value || !datePipeOptions) return '';

        return pipeDate(value, datePipeOptions);
      }
      case 'number': {
        if (value === '' || isNaN(+value) || !decimalPipeOptions) return '';

        return pipeNumber(+value, decimalPipeOptions);
      }
      case 'currency': {
        if (value === '' || isNaN(+value) || !currencyPipeOptions) return '';

        return pipeCurrency(+value, currencyPipeOptions);
      }
      default:
        return value;
    }
  } catch (e) {
    return '';
  }
}

export function formatValue(options: FormatOptions): string {
  const { maskService, prefix, suffix, maskPattern } = options;

  return (prefix || '') + (maskPattern && maskService ? maskService.applyMask(pipeValue(options), maskPattern) : pipeValue(options)) + (suffix || '');
}
