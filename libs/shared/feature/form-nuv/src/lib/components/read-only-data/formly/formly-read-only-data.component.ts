import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NuverialReadOnlyDataComponent, NuverialRichTextViewerComponent, formatValue } from '@dsg/shared/ui/nuverial';
import { FormlyModule } from '@ngx-formly/core';
import { NgxMaskPipe, NgxMaskService, provideNgxMask } from 'ngx-mask';
import { FormlyBaseComponent } from '../../base';
import { FormlyReadOnlyDataFieldProperties } from './formly-read-only-data.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule, NgxMaskPipe, NuverialRichTextViewerComponent, NuverialReadOnlyDataComponent],
  providers: [provideNgxMask()],
  selector: 'dsg-formly-read-only-data',
  standalone: true,
  styleUrls: ['./formly-read-only-data.component.scss'],
  templateUrl: './formly-read-only-data.component.html',
})
export class FormlyReadOnlyDataComponent extends FormlyBaseComponent<FormlyReadOnlyDataFieldProperties> {
  constructor(private readonly _ngxMaskService: NgxMaskService) {
    super();
  }
  public get formattedValue(): string {
    return formatValue({
      currencyPipeOptions: this.props.currencyPipeOptions,
      datePipeOptions: this.props.datePipeOptions,
      decimalPipeOptions: this.props.decimalPipeOptions,
      formatType: this.props.formatType,
      maskPattern: this.props.mask,
      maskService: this._ngxMaskService,
      prefix: this.props.prefix,
      suffix: this.props.suffix,
      value: this.formControl.value === null || this.formControl.value === undefined ? '' : this.formControl.value,
    });
  }
}
