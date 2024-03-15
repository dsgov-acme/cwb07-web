import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, Renderer2 } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SchemaTreeDefinitionModel } from '@dsg/shared/data-access/work-api';
import { NuverialIconComponent } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, tap } from 'rxjs';
import { SchemaTreeService } from '../../services';
import { BaseFormlyFieldProperties, FormioBaseCustomComponent } from '../base';
import { SchemaKeySelectorModalComponent } from '../schema-key-selector-modal';

interface SchemaKeySelectorFieldProps extends BaseFormlyFieldProperties {
  buttonLabel?: string;
  allowedSchemaTypes?: string[]; // Empty array means all types are allowed.
  noWrap?: boolean; // Disable text wrap, used for key selectors in tables
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent],
  selector: 'dsg-schema-key-selector',
  standalone: true,
  styleUrls: ['./schema-key-selector.component.scss'],
  templateUrl: './schema-key-selector.component.html',
})
export class SchemaKeySelectorComponent extends FormioBaseCustomComponent<string | null, SchemaKeySelectorFieldProps> implements OnInit {
  public selectedSchemaKey = '';
  public dialogRef?: MatDialogRef<SchemaKeySelectorModalComponent>;

  // This observable is just to load the schema tree from API so it's stored in the service
  private readonly _schemaTree$: BehaviorSubject<SchemaTreeDefinitionModel> = new BehaviorSubject<SchemaTreeDefinitionModel>(new SchemaTreeDefinitionModel());

  constructor(
    private readonly _dialog: MatDialog,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _renderer: Renderer2,
    private readonly _schemaTreeService: SchemaTreeService,
  ) {
    super();
  }

  @Input() public override set value(v: string | null) {
    if (this.disabled) {
      this.setSelectedSchemaKey(null);
    } else if (v != null && this._verifySchemaKeyType(v)) {
      this.setSelectedSchemaKey(v);
    } else {
      this.setSelectedSchemaKey('');
    }
  }

  public override get value() {
    return super.value;
  }

  public get label(): string {
    return this.props.buttonLabel ?? 'MAP SCHEMA ATTRIBUTE';
  }

  public ngOnInit(): void {
    this._schemaTreeService
      .getSchemaKeySelectorSchemaTree$()
      .pipe(
        tap(schemaTree => {
          if (schemaTree) {
            this._schemaTree$.next(schemaTree);
            if (!schemaTree.key) {
              this.disabled = true;
              this.setSelectedSchemaKey(null);
            }
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public setSelectedSchemaKey(key: string | null) {
    this.selectedSchemaKey = key || '';
    super.value = key;
    this.formControl.setValue(key);
    this.valueChange.emit(key);
  }

  public openModal(): void {
    if (this.disabled) return;

    const builderDialog = document.querySelector('.formio-dialog');
    if (builderDialog) this._renderer.setStyle(builderDialog, 'display', 'none');

    this.dialogRef = this._dialog.open(SchemaKeySelectorModalComponent, {
      autoFocus: false,
      data: {
        allowedSchemaTypes: this.props.allowedSchemaTypes,
      },
    });

    this.dialogRef
      .afterClosed()
      .pipe(
        tap(response => {
          if (response) {
            this.setSelectedSchemaKey(response);
            this._changeDetectorRef.markForCheck();
          }

          if (builderDialog) this._renderer.removeStyle(builderDialog, 'display');
        }),
      )
      .subscribe();
  }

  /**
   * Check the tree for whether the selected schema key's node is of the allowed type
   */
  private _verifySchemaKeyType(key: string) {
    const tree = SchemaTreeDefinitionModel.toTree(this._schemaTree$.getValue());
    const keySteps = key.split('.');
    const keyNode = SchemaTreeDefinitionModel.findNodeByKey(keySteps, tree, tree);
    if (keyNode) {
      return this.props.allowedSchemaTypes?.length == 0 || this.props.allowedSchemaTypes?.includes(keyNode['type'] as string);
    }

    return false;
  }
}
