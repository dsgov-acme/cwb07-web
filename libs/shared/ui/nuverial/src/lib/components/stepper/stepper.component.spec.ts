import { CommonModule } from '@angular/common';
import { MatStep, MatStepper, MatStepperModule } from '@angular/material/stepper';
import { By } from '@angular/platform-browser';
import { render } from '@testing-library/angular';

import { ObserversModule } from '@angular/cdk/observers';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { TemplateRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { axe } from 'jest-axe';
import { MockBuilder, MockProvider, ngMocks } from 'ng-mocks';
import { of, tap } from 'rxjs';
import { UnsavedChangesService } from '../../services';
import { UnsavedStepModalReponses } from '../unsaved-step-modal/unsaved-step-modal.component';
import { NuverialStepperComponent } from './stepper.component';
import { IStep } from './stepper.model';

const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: () => of(UnsavedStepModalReponses.SaveAndContinue),
  }),
};

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
}));

const dependencies = MockBuilder(NuverialStepperComponent)
  .keep(MatStepperModule)
  .keep(MatStepper)
  .keep(MatStep)
  .keep(ObserversModule)
  .keep(CommonModule)
  .provide(MockProvider(MatDialog, mockDialog))
  .provide(
    MockProvider(UnsavedChangesService, {
      openConfirmationModal$: jest.fn().mockReturnValue(of(true)),
    }),
  )
  .build();

const STEPS: IStep[] = [
  { hidden: true, label: 'User Information', state: 'SAVED', stepKey: 'userInfo' },
  { label: 'Address Information', state: 'UNLOCKED', stepKey: 'addressInfo' },
  { label: 'Done', stepKey: 'confirmation' },
];

const ACTIVE_STEPS: IStep[] = [
  { label: 'Address Information', state: 'UNLOCKED', stepKey: 'addressInfo' },
  { label: 'Done', stepKey: 'confirmation' },
];

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(NuverialStepperComponent, {
    ...dependencies,
    ...props,
  });

  return { fixture };
};

const getFixtureByTemplate = async () => {
  const { fixture } = await render(
    `<nuverial-stepper [steps]="steps" #stepper>
  <ng-template nuverialStepperKey="userInfo" let-form>
      <nuverial-section-header>
        <div nuverialCardContentType="label">Basic User Information</div>
      </nuverial-section-header>
      <br />
  </ng-template>
  <ng-template nuverialStepperKey="addressInfo" let-form>
      <nuverial-section-header>
        <div nuverialCardContentType="label">Basic Address Information</div>
      </nuverial-section-header>
      <br />
  </ng-template>
  <ng-template nuverialStepperKey="confirmation" let-form>
    <h5>Form is complete</h5>
  </ng-template>
</nuverial-stepper>`,
    {
      ...dependencies,
      componentProperties: {
        steps: STEPS,
      },
    },
  );
  const component = fixture.componentInstance;

  return { component, fixture };
};

describe('StepperComponent', () => {
  describe('Accessibility', () => {
    it('should have no violations when ariaLabel is set', async () => {
      const { fixture } = await getFixture({ componentProperties: { ariaLabel: 'stepper', steps: STEPS } });
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });
  it('should create', async () => {
    const { fixture } = await getFixture({});
    expect(fixture).toBeTruthy();
  });

  it('can define a default stepper component', async () => {
    const { fixture } = await getFixture({});

    expect(fixture).toBeTruthy();
    expect(fixture.componentInstance.ariaLabel).toEqual(undefined);
    expect(fixture.componentInstance.steps).toEqual([]);
    expect(fixture.componentInstance.stepper).toBeTruthy();
    expect(fixture.componentInstance.orientation).toEqual('horizontal');
  });

  it('should change to vertical orientation if nativeElement is less than 500px width ', async () => {
    const { fixture } = await getFixture({ componentProperties: { ariaLabel: 'stepper', steps: STEPS } });
    const component = fixture.componentInstance;
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      disconnect: jest.fn(),
      observe: jest.fn(() => (component.stepperOrientation = 'vertical')),
      unobserve: jest.fn(),
    }));
    const mockElement = document.createElement('div') as HTMLElement;
    mockElement.style.width = '100px';
    component['_elementRef'].nativeElement = mockElement;

    component.ngAfterViewInit();

    expect(component.stepperOrientation).toBe('vertical');
  });

  it('should call disconnect on ResizeObserver when ngOnDestroy() is called', async () => {
    const { fixture } = await getFixture({});
    fixture.componentInstance.ngOnDestroy();

    expect(fixture.componentInstance['_resizeObserver']?.disconnect).toHaveBeenCalled();
  });

  it('should set steps list and advance to next step', async () => {
    STEPS[1].state = 'SAVED';
    const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });

    expect(STEPS.length).toEqual(fixture.componentInstance.steps?.length);
    expect(ACTIVE_STEPS.length).toEqual(fixture.componentInstance.stepper.steps.length);
    fixture.componentInstance.stepper.selectedIndex = 0;
    fixture.componentInstance.stepper.next();

    fixture.detectChanges();
    expect(fixture.componentInstance.stepper.selectedIndex).toEqual(1);
  });

  it('should default to no mat steppers in DOM if there are no steps', async () => {
    const { fixture } = await getFixture({});
    fixture.detectChanges();
    const steps = fixture.debugElement.queryAll(By.css('.mat-step-header'));
    expect(steps.length).toEqual(0);
    expect(fixture.componentInstance.stepper.steps.length).toEqual(0);
  });

  it('should return only non-hidden steps', async () => {
    ACTIVE_STEPS[0].state = 'SAVED';
    ACTIVE_STEPS[1].state = 'UNLOCKED';
    const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });

    const activeSteps = fixture.componentInstance.activeSteps;

    expect(activeSteps).toEqual(ACTIVE_STEPS);
  });

  it('should return an empty array when steps is undefined', async () => {
    const { fixture } = await getFixture({ componentProperties: { steps: undefined } });

    const activeSteps = fixture.componentInstance.activeSteps;

    expect(activeSteps).toEqual([]);
  });

  // There is an issue with getting the mat steps to render so will have revisit to do more tests on the DOM
  it('should render the matStepper and steps', fakeAsync(async () => {
    const { fixture } = await getFixtureByTemplate();
    fixture.detectChanges();
    const stepper = fixture.debugElement.queryAll(By.css('mat-stepper'));
    expect(stepper.length).toEqual(1);
  }));

  it.skip('should set the steps with the matching labels', fakeAsync(async () => {
    const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
    fixture.detectChanges();
    tick(1000);
    fixture.detectChanges();
    const labelContents = fixture.nativeElement.querySelector('.mat-step-text-label');
    expect(labelContents).toEqual('User Information');
  }));
  it('should tell if the user is on the first step', async () => {
    const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });

    fixture.componentInstance.stepper.selectedIndex = 0;
    fixture.detectChanges();

    expect(fixture.componentInstance.isFirstStep).toBeTruthy();
    expect(fixture.componentInstance.isLastStep).toBeFalsy();
  });
  it('should tell if the user is on the last step', async () => {
    STEPS[1].state = 'SAVED';
    const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });

    fixture.componentInstance.stepper.next();
    fixture.detectChanges();

    expect(fixture.componentInstance.isFirstStep).toBeFalsy();
    expect(fixture.componentInstance.isLastStep).toBeTruthy();
  });
  describe('Step Navigation', () => {
    it('should filter through all steps and emit selected step on navigation', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      fixture.detectChanges();

      fixture.componentInstance.stepSelected
        .pipe(
          tap(selected => {
            expect(selected).toBeTruthy();
            expect(selected).toBe({
              nextStep: 1,
              prevStep: 0,
            });
          }),
        )
        .subscribe();

      const stepperSelectionEvent = new StepperSelectionEvent();
      stepperSelectionEvent.selectedIndex = 0;
      stepperSelectionEvent.previouslySelectedIndex = 1;
      fixture.componentInstance.onStepChange(stepperSelectionEvent);
    });
    it('should focus on active step header on selection change', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      const activeStepHeader = document.createElement('div');
      activeStepHeader.setAttribute('aria-selected', 'true');
      jest.spyOn(document, 'querySelector').mockReturnValue(activeStepHeader);
      jest.spyOn(activeStepHeader, 'focus');
      fixture.componentInstance.ngAfterViewInit();
      fixture.componentInstance.stepper.selectionChange.emit();
      expect(activeStepHeader.focus).toHaveBeenCalled();
    });
  });

  describe('Step states after view init', () => {
    it('should set step state to "done" for valid controls', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      fixture.detectChanges();
      const step1 = fixture.componentInstance.stepper.steps.get(0);
      const step2 = fixture.componentInstance.stepper.steps.get(1);
      const step3 = fixture.componentInstance.stepper.steps.get(2);

      if (step1 && step2 && step3) {
        step1.stepControl = new FormControl();
        step2.stepControl = new FormControl();
        step3.stepControl = new FormControl();

        // Set stepControl states to valid
        step1.stepControl.setErrors(null);
        step2.stepControl.setErrors(null);
        step3.stepControl.setErrors(null);

        fixture.componentInstance.ngAfterViewInit();
        fixture.detectChanges();

        expect(step1.state).toBe('done');
        expect(step2.state).toBe('done');
        expect(step3.state).toBe('done');
      }
    });

    it('should set step state to "done" for previous valid controls', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      fixture.componentInstance.steps.forEach(step => {
        step.state = undefined;
      });
      fixture.detectChanges();
      const step1 = fixture.componentInstance.stepper.steps.get(0);
      const step2 = fixture.componentInstance.stepper.steps.get(1);
      const step3 = fixture.componentInstance.stepper.steps.get(2);

      if (step1 && step2 && step3) {
        step1.stepControl = new FormControl();
        step2.stepControl = new FormControl();

        // Set stepControl states to valid
        step1.stepControl.setErrors(null);
        step2.stepControl.setErrors({});

        fixture.componentInstance.ngAfterViewInit();
        fixture.detectChanges();

        expect(step1.state).toBe('done');
        expect(step2.state).toBeUndefined();
        expect(step3.state).toBeUndefined();

        expect(fixture.componentInstance.steps[0].state).toBe('SAVED');
        expect(fixture.componentInstance.steps[1].state).toBe('UNLOCKED');
        expect(fixture.componentInstance.steps[2].state).toBe('LOCKED');
      }
    });

    it('should be able to move between SAVED and UNLOCKED steps and not be able to go to LOCKED steps', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      await fixture.whenStable();
      fixture.componentInstance.steps.forEach(step => {
        step.state = undefined;
      });
      fixture.detectChanges();
      const step1 = fixture.componentInstance.stepper.steps.get(0);
      const step2 = fixture.componentInstance.stepper.steps.get(1);
      const step3 = fixture.componentInstance.stepper.steps.get(2);

      if (step1 && step2 && step3) {
        step1.stepControl = new FormControl();
        step2.stepControl = new FormControl();

        // Set stepControl states to valid
        step1.stepControl.setErrors(null);
        step2.stepControl.setErrors({});

        fixture.componentInstance.ngAfterViewInit();
        fixture.detectChanges();

        expect(step1.state).toBe('done');
        expect(step2.state).toBeUndefined();
        expect(step3.state).toBeUndefined();

        expect(fixture.componentInstance.steps[0].state).toBe('SAVED');
        expect(fixture.componentInstance.steps[1].state).toBe('UNLOCKED');
        expect(fixture.componentInstance.steps[2].state).toBe('LOCKED');

        fixture.componentInstance.stepper.selectedIndex = 0;
        expect(fixture.componentInstance.stepper.selectedIndex).toBe(0);

        fixture.componentInstance.stepper.selectedIndex = 1;
        expect(fixture.componentInstance.stepper.selectedIndex).toBe(1);

        fixture.componentInstance.stepper.selectedIndex = 2;
        expect(fixture.componentInstance.stepper.selectedIndex).toBe(1);

        fixture.componentInstance.stepper.selectedIndex = 0;
        expect(fixture.componentInstance.stepper.selectedIndex).toBe(0);
      }
    });

    it('should set step state to "SAVED" if previous step is valid', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      fixture.detectChanges();
      const step1 = fixture.componentInstance.stepper.steps.get(0);
      const step2 = fixture.componentInstance.stepper.steps.get(1);

      if (step1 && step2) {
        step1.stepControl = new FormControl();
        step2.stepControl = new FormControl();

        // Set stepControl states to valid
        step1.stepControl.setErrors(null);
        step2.stepControl.setErrors(null);

        fixture.componentInstance.ngAfterViewInit();
        fixture.detectChanges();

        expect(fixture.componentInstance.activeSteps[1].state).toBe('SAVED');
      }
    });

    it('should set step state to "SAVED" if step control is valid', async () => {
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      fixture.detectChanges();
      const step1 = fixture.componentInstance.stepper.steps.get(0);

      if (step1) {
        step1.stepControl = new FormControl();

        // Set stepControl state to valid
        step1.stepControl.setErrors(null);

        fixture.componentInstance.ngAfterViewInit();
        fixture.detectChanges();

        expect(fixture.componentInstance.activeSteps[0].state).toBe('SAVED');
      }
    });
  });

  describe('Unsaved changes modal', () => {
    it('should launch modal when there are unsaved changes', async () => {
      const model = {};
      const modelSnapshot = JSON.stringify(model);
      const { fixture } = await getFixture({ componentProperties: { model: model, modelSnapshot: modelSnapshot, steps: STEPS } });
      await fixture.whenStable();
      fixture.componentInstance.steps.forEach(step => {
        step.state = undefined;
      });
      fixture.detectChanges();
      const step1 = fixture.componentInstance.stepper.steps.get(0);
      const step2 = fixture.componentInstance.stepper.steps.get(1);
      const step3 = fixture.componentInstance.stepper.steps.get(2);

      if (step1 && step2 && step3) {
        step1.stepControl = new FormControl();
        step2.stepControl = new FormControl();

        // Set stepControl states to valid
        step1.stepControl.setErrors(null);
        step2.stepControl.setErrors({});

        fixture.componentInstance.ngAfterViewInit();
        fixture.detectChanges();

        expect(step1.state).toBe('done');
        expect(step2.state).toBeUndefined();
        expect(step3.state).toBeUndefined();

        expect(fixture.componentInstance.steps[0].state).toBe('SAVED');
        expect(fixture.componentInstance.steps[1].state).toBe('UNLOCKED');
        expect(fixture.componentInstance.steps[2].state).toBe('LOCKED');

        //new data in the model
        fixture.componentInstance.model = { test: 'test' };

        fixture.componentInstance.stepper?.steps.get(1)?.select?.();

        const service = ngMocks.findInstance(UnsavedChangesService);
        const dialogSpy = jest.spyOn(service, 'openConfirmationModal$');
        expect(dialogSpy).toBeCalled();

        expect(fixture.componentInstance.stepper.selectedIndex).toBe(0);
      }
    });
  });

  describe('addTemplate', () => {
    it('should not modify other steps', async () => {
      const template = {} as TemplateRef<void>;
      const { fixture } = await getFixture({ componentProperties: { steps: STEPS } });
      const component = fixture.componentInstance;

      component.addTemplate('confirmation', template);
      expect(component.steps[0].template).not.toEqual(template);
      expect(component.steps[1].template).not.toEqual(template);
      expect(component.steps[2].template).toEqual(template);
    });

    it('should not throw error if steps is undefined', fakeAsync(async () => {
      const template = {} as TemplateRef<void>;
      const { fixture } = await getFixture({ componentProperties: { steps: undefined } });
      const component = fixture.componentInstance;
      expect(() => component.addTemplate('confirmation', template)).not.toThrowError();
    }));
  });

  it('_hasUnsavedChanges', async () => {
    const model = { some: 'data' };
    const modelSnapshot = JSON.stringify(model);
    const { fixture } = await getFixture({ componentProperties: { model: model, modelSnapshot: modelSnapshot, steps: STEPS } });
    await fixture.whenStable();
    const component = fixture.componentInstance;

    const result = component['_hasUnsavedChanges']();
    expect(result).toBeFalsy();
  });

  describe('_validateBeforeChangingStep', () => {
    it('should return if state is "LOCKED"', async () => {
      STEPS[0].state = 'LOCKED';
      const step = {} as MatStep;
      const { fixture } = await getFixture({ componentProperties: { activeSteps: ACTIVE_STEPS, steps: STEPS } });
      await fixture.whenStable();
      const component = fixture.componentInstance;

      component['_validateBeforeChangingStep'](step, undefined, 2);
      expect(step.select).toBeDefined();
      expect(step.select).toBeInstanceOf(Function);
      expect(step.select).toEqual(expect.any(Function));
    });
  });
});
