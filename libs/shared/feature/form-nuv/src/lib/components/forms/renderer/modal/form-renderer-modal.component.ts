import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NuverialButtonComponent, NuverialIconComponent, UnsavedChangesService } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyModule } from '@ngx-formly/core';
import { map, tap } from 'rxjs';
import { FormRendererModule } from '../../../../form-renderer.module';
import { FormRendererService } from '../../../../services/form-renderer.service';
import { FormRendererBaseComponent } from '../form-renderer-base.component';
import { IntakeModalRendererOptions, NuvalenceFormRendererOptions } from '../renderer.model';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, FormRendererModule, FormlyModule, NuverialButtonComponent, NuverialIconComponent],
  selector: 'dsg-form-renderer-modal',
  standalone: true,
  styleUrls: ['./form-renderer-modal.component.scss'],
  templateUrl: './form-renderer-modal.component.html',
})
export class FormRendererModalComponent extends FormRendererBaseComponent implements OnInit, OnDestroy {
  @HostBinding('class.form-renderer-modal') public componentClass = true;

  /** The form options, initial form state */
  public options: NuvalenceFormRendererOptions = IntakeModalRendererOptions;

  /** The form configuration json */
  public fields$ = this._formRendererService.modalFormConfiguration$.pipe(map(formConfigurationModel => formConfigurationModel?.toModalIntakeForm()));

  constructor(
    private readonly _dialog: MatDialogRef<FormRendererModalComponent>,
    protected override readonly _formRendererService: FormRendererService,
    protected override readonly _unsavedChangesService: UnsavedChangesService,
  ) {
    super(_formRendererService, _unsavedChangesService);

    this._formRendererService.closeModal$
      .pipe(
        tap(() => this._dialog.close()),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public ngOnInit(): void {
    setTimeout(() => {
      this._formRendererService.isModalOpen = true;
    });
  }

  public ngOnDestroy(): void {
    this._formRendererService.cleanUpModal();
    this.options.resetModel?.();
  }
}
