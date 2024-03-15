import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { provideMock } from '@testing-library/angular/jest-utils';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { UnsavedChangesService } from '../services';
import { CanDeactivateStepperContract } from './stepper-unsaved-data.guard';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'nuverial-mock-form',
  template: '',
})
class MockFormComponent {
  public dialog!: MatDialog;
}

describe('CanDeactivateFormBuilder', () => {
  let guard: CanDeactivateStepperContract<MockFormComponent>;
  let unsavedChangesService: UnsavedChangesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CanDeactivateStepperContract,
        provideMock(Router),
        MockProvider(UnsavedChangesService, {
          model: {},
          modelSnapshot: '',
          saveAndContinue: jest.fn(),
          openConfirmationModal$: jest.fn().mockReturnValue(of(true)),
        }),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });

    guard = TestBed.inject(CanDeactivateStepperContract);
    unsavedChangesService = ngMocks.findInstance(UnsavedChangesService);

    return MockRender(MockFormComponent);
  });

  it('should create', () => {
    expect(guard).toBeTruthy();
  });

  it('return true if hasUnsavedChanges is false', done => {
    jest.spyOn(unsavedChangesService, 'hasUnsavedChanges', 'get').mockReturnValue(false);
    const fixture = MockRender(MockFormComponent, { reset: true });
    const component = fixture.point.componentInstance;

    const canDeactivate = guard.canDeactivate(component);

    canDeactivate.subscribe(result => {
      expect(result).toBeTruthy();
      done();
    });
  });

  it('returns whatever openConfirmationModal$ returns if hasUnsavedChanges is true', done => {
    jest.spyOn(unsavedChangesService, 'hasUnsavedChanges', 'get').mockReturnValue(true);
    const fixture = MockRender(MockFormComponent, { reset: true });
    const component = fixture.point.componentInstance;
    const service = ngMocks.findInstance(UnsavedChangesService);
    jest.spyOn(service, 'openConfirmationModal$').mockReturnValue(of(false));

    const canDeactivate = guard.canDeactivate(component);

    canDeactivate.subscribe(result => {
      expect(result).toBeFalsy();
      done();
    });
  });
});
