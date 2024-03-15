import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { HttpTestingModule } from '@dsg/shared/utils/http';
import { MockProvider } from 'ng-mocks';
import { of, take } from 'rxjs';
import { UnsavedStepModalReponses } from '../../components';
import { UnsavedChangesService } from './unsaved-changes.service';

describe('UnsavedChangesService', () => {
  let service: UnsavedChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpTestingModule],
      providers: [
        MockProvider(MatDialog, {
          open: jest.fn().mockReturnValue({ afterClosed: jest.fn().mockReturnValue(of(true)) }),
        }),
      ],
    });
    service = TestBed.inject(UnsavedChangesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial model and modelSnapshot values', () => {
    expect(service.model).toBeUndefined();
    expect(service.modelSnapshot).toBe('');
  });

  it('should have a saveAndContinue$ observable', () => {
    expect(service.saveAndContinue$).toBeDefined();
  });

  it('should have a hasUnsavedChanges getter that returns false when model and modelSnapshot are equal', () => {
    const model = { prop: 'value' };
    service.model = model;
    service.modelSnapshot = JSON.stringify(model);

    expect(service.hasUnsavedChanges).toBe(false);
  });

  it('should have a hasUnsavedChanges getter that returns true when model and modelSnapshot are not equal', () => {
    service.model = { prop: 'value' };
    service.modelSnapshot = JSON.stringify({ prop: 'different value' });

    expect(service.hasUnsavedChanges).toBe(true);
  });

  it('should call _saveAndContinue.next() when saveAndContinue() is called', () => {
    jest.spyOn(service['_saveAndContinue'], 'next');
    service.saveAndContinue();

    expect(service['_saveAndContinue'].next).toHaveBeenCalled();
  });

  it('should call _dialog.open() when openConfirmationModal() is called', () => {
    jest.spyOn(service['_dialog'], 'open');
    service.openConfirmationModal$(
      () => true,
      () => true,
    );

    expect(service['_dialog'].open).toHaveBeenCalled();
  });

  it('should call proceed() when the modal is closed with UnsavedStepModalReponses.ProceedWithoutChanges', () => {
    jest.spyOn(service['_dialog'], 'open').mockReturnValue({ afterClosed: () => of(UnsavedStepModalReponses.ProceedWithoutChanges) } as any);
    const proceed = jest.fn();
    const save = jest.fn();
    service.openConfirmationModal$(proceed, save).subscribe();

    expect(proceed).toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('should call save() when the modal is closed with UnsavedStepModalReponses.SaveAndContinue', () => {
    jest.spyOn(service['_dialog'], 'open').mockReturnValue({ afterClosed: () => of(UnsavedStepModalReponses.SaveAndContinue) } as any);
    const proceed = jest.fn();
    const save = jest.fn();
    service.openConfirmationModal$(proceed, save).subscribe();

    expect(save).toHaveBeenCalled();
    expect(proceed).not.toHaveBeenCalled();
  });

  it('should call neither callback when the modal is closed without pressing a button', () => {
    jest.spyOn(service['_dialog'], 'open').mockReturnValue({ afterClosed: () => of('') } as any);
    const proceed = jest.fn();
    const save = jest.fn();
    service.openConfirmationModal$(proceed, save).subscribe();

    expect(save).not.toHaveBeenCalled();
    expect(proceed).not.toHaveBeenCalled();
  });

  describe('openConfirmationModal$', () => {
    it('return true if modal returns ProceedWithoutChanges', done => {
      jest.spyOn(service['_dialog'], 'open').mockReturnValue({ afterClosed: () => of(UnsavedStepModalReponses.ProceedWithoutChanges) } as any);

      service
        .openConfirmationModal$(
          () => true,
          () => true,
        )
        .subscribe(result => {
          expect(result).toBeTruthy();
          done();
        });
    });

    it('return true if modal returns SaveAndContinue and saving emits false', fakeAsync(() => {
      jest.spyOn(service['_dialog'], 'open').mockReturnValue({ afterClosed: () => of(UnsavedStepModalReponses.SaveAndContinue) } as any);

      const observable$ = service.openConfirmationModal$(
        () => true,
        () => true,
      );

      let result = false;
      observable$.pipe(take(1)).subscribe(res => {
        result = res;
      });

      service.setNotSaving();

      flush();
      expect(result).toBeTruthy();
    }));

    it('return false if modal returns something else', done => {
      jest.spyOn(service['_dialog'], 'open').mockReturnValue({ afterClosed: () => of('') } as any);

      service
        .openConfirmationModal$(
          () => true,
          () => true,
        )
        .subscribe(result => {
          expect(result).toBeFalsy();
          done();
        });
    });
  });
});
