import { Directive, HostBinding } from '@angular/core';
import { FieldType, FieldTypeConfig, FormlyFieldConfig } from '@ngx-formly/core';
import { FormStateMode } from '../../forms/renderer/renderer.model';
import { BaseFormlyFieldProperties } from './formly-base.model';

// base components are decorated with @Directive()
@Directive()
export class FormlyBaseComponent<T = BaseFormlyFieldProperties> extends FieldType<FieldTypeConfig<T>> {
  public formStateMode = FormStateMode;

  @HostBinding('id') public get componentId() {
    const id = this._generateId(this.field);

    return id ? `${id}-field` : '';
  }

  public get mode(): FormStateMode {
    return this.formState.mode;
  }

  public set mode(mode: FormStateMode) {
    this.formState.mode = mode;
  }

  private _generateId(field: FormlyFieldConfig): string {
    let id = '';

    if (field.parent) {
      id += this._generateId(field.parent);
    }

    if (id && field.key) {
      id += '.';
    }

    if (field.key) {
      id += field.key;
    }

    return id;
  }
}
