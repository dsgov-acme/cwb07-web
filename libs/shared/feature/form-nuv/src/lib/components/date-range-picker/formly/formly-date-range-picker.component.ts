import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateRangePickerControl, NuverialCardContentDirective, NuverialDateRangePickerComponent } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyExtension, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { tap } from 'rxjs';
import { FormlyBaseComponent, defaultPrePopulateDisplayOnlyComponent, isPrePopulated } from '../../base';
import { DateRangePickerFieldProperties } from '../models/formly-date-range-picker.model';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule, NuverialDateRangePickerComponent, NuverialCardContentDirective],
  selector: 'dsg-formly-date-range-picker',
  standalone: true,
  styleUrls: ['./formly-date-range-picker.component.scss'],
  templateUrl: './formly-date-range-picker.component.html',
})
export class FormlyDateRangePickerComponent extends FormlyBaseComponent<DateRangePickerFieldProperties> implements OnInit, FormlyExtension {
  public dateControl = new FormControl<DateRangePickerControl>({
    endDate: null,
    startDate: null,
  });

  public ngOnInit() {
    // On init, patch the date control (Date objs) with the formly model values (String 'yyyy-mm-dd')
    if (this.field.props.startDateKey && this.field.props.endDateKey) {
      this.dateControl.patchValue({
        endDate: this.formControl.get(this.field.props.endDateKey)?.value as Date,
        startDate: this.formControl.get(this.field.props.startDateKey)?.value as Date,
      });
    }

    // Update the picker's mapped attribute keys in the formly model
    this.dateControl.valueChanges
      .pipe(
        tap(() => {
          if (this.field.props.startDateKey && this.field.props.endDateKey) {
            this.formControl.get(this.field.props.startDateKey)?.setValue(this.dateControl.value?.startDate);
            this.formControl.get(this.field.props.endDateKey)?.setValue(this.dateControl.value?.endDate);
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public prePopulate(field: FormlyFieldConfig<DateRangePickerFieldProperties>): void {
    if (isPrePopulated(field)) return;
    defaultPrePopulateDisplayOnlyComponent(field);

    // Since we don't define the two start/end fields in the FormIO schema, we create them manually here
    const startDateField: FormlyFieldConfig = {
      key: field.props?.startDateKey,
      props: {
        required: field.props?.required,
      },
    };

    const endDateField: FormlyFieldConfig = {
      key: field.props?.endDateKey,
      props: {
        required: field.props?.required,
      },
    };
    field.fieldGroup = [startDateField, endDateField];
  }

  public trackByFn(_index: number, item: FormlyFieldConfig) {
    return item.id;
  }
}
