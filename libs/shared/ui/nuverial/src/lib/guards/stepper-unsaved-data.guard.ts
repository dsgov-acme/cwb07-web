import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { UnsavedChangesService } from '../services';

@Injectable({
  providedIn: 'root',
})
export class CanDeactivateStepperContract<T extends { dialog: MatDialog }> {
  constructor(private readonly _unsavedChangesService: UnsavedChangesService) {}

  public canDeactivate(_component: T): Observable<boolean> {
    if (!this._unsavedChangesService.hasUnsavedChanges) {
      return of(true);
    }

    // Don't subscribe because the deactivation guard will subscribe to it
    return this._unsavedChangesService.openConfirmationModal$(
      () => true,
      () => this._unsavedChangesService.saveAndContinue(),
    );
  }
}

/**
 * Use it like a canDeactivate guard
 * ```
 *    {
        canDeactivate: [CanDeactivateStepperGuard],
        ...
      },
 * ````
 */
export const CanDeactivateStepperGuard = <T extends { dialog: MatDialog }>(component: T) => {
  return inject(CanDeactivateStepperContract).canDeactivate(component);
};
