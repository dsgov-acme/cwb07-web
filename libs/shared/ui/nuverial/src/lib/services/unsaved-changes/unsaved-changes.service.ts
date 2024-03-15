import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subject, filter, map, of, switchMap, take } from 'rxjs';
import { UnsavedStepModalComponent, UnsavedStepModalReponses } from '../../components';
import { stringifyModel } from '../../utils';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  public model: unknown;
  public modelSnapshot = '';

  public saveAndContinue$: Observable<void>;
  public saving$: Observable<boolean>;

  private readonly _saveAndContinue: Subject<void> = new Subject();
  private readonly _saving = new Subject<boolean>();

  constructor(private readonly _dialog: MatDialog) {
    this.saveAndContinue$ = this._saveAndContinue.asObservable();
    this.saving$ = this._saving.asObservable();
  }

  public get hasUnsavedChanges(): boolean {
    const modelStr = stringifyModel(this.model);

    return this.modelSnapshot != modelStr;
  }

  public saveAndContinue(): void {
    this._saveAndContinue.next();
  }

  public setSaving(): void {
    this._saving.next(true);
  }

  public setNotSaving(): void {
    this._saving.next(false);
  }

  /**
   * Open a confirmation modal to ask the user if they want to proceed without saving changes.
   *
   * @param proceed - function to call to proceed without saving
   * @param save - function to call to save and continue
   * @returns an boolean observable representing if navigation should proceed.
   */
  public openConfirmationModal$(proceed: () => void, save: () => void): Observable<boolean> {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = false;

    return this._dialog
      .open(UnsavedStepModalComponent, dialogConfig)
      .afterClosed()
      .pipe(
        take(1),
        switchMap(action => {
          if (action === UnsavedStepModalReponses.ProceedWithoutChanges) {
            proceed();

            return of(true);
          } else if (action === UnsavedStepModalReponses.SaveAndContinue) {
            save();

            return this.saving$.pipe(
              filter(saving => !saving),
              map(() => true),
              take(1),
              untilDestroyed(this),
            );
          }

          return of(false);
        }),
      );
  }
}
