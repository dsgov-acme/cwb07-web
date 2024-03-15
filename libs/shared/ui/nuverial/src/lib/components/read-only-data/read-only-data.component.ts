import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgxMaskService, provideNgxMask } from 'ngx-mask';
import { formatValue } from '../../utils';
import { NuverialRichTextViewerComponent } from '../rich-text/viewer/rich-text-viewer.component';

export interface FormatOptions {
  value: string;
  formatType: string;
  maskService?: NgxMaskService;
  prefix?: string;
  suffix?: string;
  maskPattern?: string;
  currencyPipeOptions?: CurrencyPipeOptions;
  datePipeOptions?: DatePipeOptions;
  decimalPipeOptions?: DecimalPipeOptions;
}

export interface CurrencyPipeOptions {
  currency: string;
  currencyCode?: string;
  digitsInfo?: string;
  locale: string;
}

export interface DatePipeOptions {
  format: string;
  timezone?: string;
  locale: string;
}

export interface DecimalPipeOptions {
  digitsInfo?: string;
  locale?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialRichTextViewerComponent],
  providers: [provideNgxMask()],
  selector: 'nuverial-read-only-data',
  standalone: true,
  styleUrls: ['./read-only-data.component.scss'],
  templateUrl: './read-only-data.component.html',
})
export class NuverialReadOnlyDataComponent {
  /**
   * The value to display
   */
  @Input() public value = '';
  /**
   * The label to display beside the value
   */
  @Input() public label? = '';
  /**
   * The mask to apply to the value for formatting
   */
  @Input() public maskPattern!: string;
  /**
   * The type of formatting to apply to the value
   */
  @Input() public formatType: 'text' | 'richText' | 'date' | 'currency' | 'number' | 'time' = 'text';
  /**
   * Whether to italicize the value
   */
  @Input() public formatItalic? = false;
  /**
   * Whether to bold the value
   */
  @Input() public formatBold? = false;
  /**
   * Whether to italicize the label
   */
  @Input() public labelItalic? = false;
  /**
   * Whether to bold the label
   */
  @Input() public labelBold? = false;
  /**
   * The font size of the label
   */
  @Input() public labelSize: 'normal' | 'large' | 'xlarge' = 'normal';
  /**
   * The prefix to display before the value
   */
  @Input() public prefix!: string;
  /**
   * The suffix to display after the value
   */
  @Input() public suffix!: string;
  /**
   * The position of the value relative to the label
   */
  @Input() public valuePosition: 'right' | 'above' | 'below' = 'right';
  /**
   * List of options to pass to the currency pipe
   */
  @Input() public currencyPipeOptions?: CurrencyPipeOptions;
  /**
   * List of options to pass to the date pipe
   */
  @Input() public datePipeOptions?: DatePipeOptions;
  /**
   * List of options to pass to the decimal pipe
   */
  @Input() public decimalPipeOptions?: DecimalPipeOptions;

  constructor(private readonly _maskService: NgxMaskService) {}

  public get flexStyle() {
    switch (this.valuePosition) {
      case 'right':
        return { 'align-items': 'center', 'flex-direction': 'row' };
      case 'above':
        return { 'align-items': 'flex-start', 'flex-direction': 'column-reverse' };
      case 'below':
        return { 'align-items': 'flex-start', 'flex-direction': 'column' };
    }
  }

  public get labelClasses() {
    return {
      bold: this.labelBold,
      italic: this.labelItalic,
      large: this.labelSize === 'large',
      xlarge: this.labelSize === 'xlarge',
    };
  }

  public get formattedValue(): string {
    return formatValue({
      currencyPipeOptions: this.currencyPipeOptions,
      datePipeOptions: this.datePipeOptions,
      decimalPipeOptions: this.decimalPipeOptions,
      formatType: this.formatType,
      maskPattern: this.maskPattern,
      maskService: this._maskService,
      prefix: this.prefix,
      suffix: this.suffix,
      value: this.value,
    });
  }
}
