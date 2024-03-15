import { CurrencyPipeOptions, DatePipeOptions, DecimalPipeOptions } from '@dsg/shared/ui/nuverial';
import { BaseFormlyFieldProperties } from '../../base';

export interface FormlyReadOnlyDataFieldProperties extends BaseFormlyFieldProperties {
  mask?: string;
  formatType: 'text' | 'richText' | 'date' | 'currency' | 'number' | 'time';
  formatItalic?: boolean;
  formatBold?: boolean;
  labelItalic?: boolean;
  labelBold?: boolean;
  labelSize?: 'normal' | 'large' | 'xlarge';
  valuePosition?: 'right' | 'above' | 'below';
  currencyPipeOptions?: CurrencyPipeOptions;
  datePipeOptions?: DatePipeOptions;
  decimalPipeOptions?: DecimalPipeOptions;
  prefix?: string;
  suffix?: string;
  hideInReviewPage?: boolean;
}
