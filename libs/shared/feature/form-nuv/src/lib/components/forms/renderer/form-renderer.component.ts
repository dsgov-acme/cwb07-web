import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { IRendererFormConfigurationSchema } from '@dsg/shared/data-access/work-api';
import { NuverialButtonComponent, NuverialFormFieldErrorComponent, NuverialIconComponent, UnsavedChangesService } from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyModule } from '@ngx-formly/core';
import { Observable, take, tap } from 'rxjs';
import { FormRendererModule } from '../../../form-renderer.module';
import { FormRendererService } from '../../../services/form-renderer.service';
import { FormRendererBaseComponent } from './form-renderer-base.component';
import { FormRendererModalComponent } from './modal/form-renderer-modal.component';
import { NuvalenceFormRendererOptions, PublicPortalIntakeRendererOptions } from './renderer.model';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormRendererModule,
    FormlyModule,
    NuverialButtonComponent,
    NuverialFormFieldErrorComponent,
    NuverialIconComponent,
  ],
  selector: 'dsg-form-renderer',
  standalone: true,
  styleUrls: ['./form-renderer.component.scss'],
  templateUrl: './form-renderer.component.html',
})
export class FormRendererComponent extends FormRendererBaseComponent implements OnInit {
  @HostBinding('class.form-renderer') public componentClass = true;

  /** The form options, initial form state */
  @Input() public options: NuvalenceFormRendererOptions = PublicPortalIntakeRendererOptions;

  /** The form configuration json */
  @Input() public fields$?: Observable<IRendererFormConfigurationSchema[]>;

  constructor(
    protected override readonly _formRendererService: FormRendererService,
    protected override readonly _unsavedChangesService: UnsavedChangesService,
    private readonly _dialog: MatDialog,
  ) {
    super(_formRendererService, _unsavedChangesService);
  }

  public ngOnInit(): void {
    let modalSnapshot = '';
    let modal: unknown;

    this._formRendererService.modalFormConfiguration$
      .pipe(
        tap(() => {
          modalSnapshot = this._unsavedChangesService.modelSnapshot;
          modal = this._unsavedChangesService.model;
          this._dialog
            .open(FormRendererModalComponent, {
              autoFocus: false,
              disableClose: false,
              maxWidth: '800px',
              panelClass: 'intake-modal',
              width: '100%',
            })
            .afterClosed()
            .pipe(
              tap(() => {
                this._unsavedChangesService.modelSnapshot = modalSnapshot;
                this._unsavedChangesService.model = modal;
              }),
              take(1),
            )
            .subscribe();
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
