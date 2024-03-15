import { ObserversModule } from '@angular/cdk/observers';
import { StepperSelectionEvent, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatStep, MatStepper, MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { tap } from 'rxjs';
import { UnsavedChangesService } from '../../services';
import { stringifyModel } from '../../utils';
import { NuverialIconComponent } from '../icon';
import { IStep, IStepEvent } from './stepper.model';
@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ObserversModule, MatStepperModule, NuverialIconComponent, MatIconModule],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
  selector: 'nuverial-stepper',
  standalone: true,
  styleUrls: ['./stepper.component.scss'],
  templateUrl: './stepper.component.html',
})
export class NuverialStepperComponent implements AfterViewInit, OnDestroy {
  /**
   * Stepper aria label
   */
  @Input() public ariaLabel?: string;

  /**
   * model with the current state of the form data
   */
  @Input() public model?: unknown;

  /**
   * model with the state of the form data each time it is saved, this helps determine if there are unsaved changes
   */
  @Input() public modelSnapshot = '';

  /**
   * Array of steps in stepper
   */
  @Input() public steps: IStep[] = [];

  /**
   * Orientation of the stepper. Can be either 'horizontal' or 'vertical'
   */
  @Input() public orientation: StepperOrientation = 'horizontal';

  /**
   * Specifies whether or not the stepper allows for free traversal of the steps
   */
  @Input() public allowStepTraversal = false;

  @ViewChild('nuvStepper') public stepper!: MatStepper;

  @Output() public readonly stepSelected: EventEmitter<IStepEvent> = new EventEmitter<IStepEvent>();
  @Output() public readonly saveAndContinue: EventEmitter<number> = new EventEmitter<number>();

  public stepperOrientation: StepperOrientation = 'horizontal';
  private _resizeObserver?: ResizeObserver;

  constructor(
    protected readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _elementRef: ElementRef<HTMLElement>,
    private readonly _unsavedChangesService: UnsavedChangesService,
  ) {}

  public get activeSteps(): IStep[] {
    return this.steps?.filter(step => !step.hidden) || [];
  }

  public get isFirstStep(): boolean {
    return this.stepper.selectedIndex === 0;
  }

  public get isLastStep(): boolean {
    return this.stepper.selectedIndex === this.activeSteps.length - 1;
  }

  public get selectedStep(): number {
    return this.stepper?.selectedIndex + 1;
  }

  public ngAfterViewInit(): void {
    this._updateStepStates(true);
    this.stepper.selectionChange
      .pipe(
        tap(() => {
          const activeStepHeader = document.querySelector('.mat-step-header[aria-selected="true"]');
          (activeStepHeader as HTMLElement)?.focus();
        }),
        untilDestroyed(this),
      )
      .subscribe();

    this._resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      if (width > 500) {
        this.stepperOrientation = 'horizontal';
      } else {
        this.stepperOrientation = 'vertical';
      }
      this._changeDetectorRef.detectChanges();
    });
    this._resizeObserver.observe(this._elementRef.nativeElement);
  }

  public ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
  }

  public addTemplate(stepKey: string, template: TemplateRef<unknown>): void {
    this.steps?.forEach(step => {
      if (step.stepKey === stepKey) {
        step.template = template;
      }
    });
  }

  public onStepChange(selectedStep: StepperSelectionEvent) {
    this.stepSelected.emit({
      nextStep: selectedStep.selectedIndex,
      prevStep: selectedStep.previouslySelectedIndex,
    });
    this._updateStepStates(false);
    if (selectedStep && selectedStep.selectedStep) selectedStep.selectedStep.state = 'number';
  }

  public trackByFn(_index: number, _item: IStep) {
    return _index;
  }

  private _updateStepStates(updateValidateStep: boolean) {
    const steps = this.stepper?.steps;
    steps?.forEach((step, index) => {
      const prevStep = steps.get(index - 1);

      if (this.activeSteps[index - 1]?.state === 'SAVED') {
        this.activeSteps[index].state = 'UNLOCKED';
      }
      if (!step?.stepControl) {
        if (prevStep?.stepControl?.valid) {
          step.state = 'done';
          this.activeSteps[index].state = 'SAVED';
        }
      }
      if (step?.stepControl?.valid) {
        step.state = 'done';
        this.activeSteps[index].state = 'SAVED';
      } else {
        if (index + 1 < this.activeSteps.length) {
          step.state = 'number';
          this.activeSteps[index + 1].state = 'LOCKED';
        }
        if (prevStep?.stepControl?.valid) {
          step.state = 'number';
          this.activeSteps[index].state = 'UNLOCKED';
        }
      }
      if (!this.activeSteps[index].state) {
        this.activeSteps[index].state = 'LOCKED';
      }
      if (!this.allowStepTraversal && updateValidateStep) {
        this._validateBeforeChangingStep(step, prevStep, index);
      }
    });
  }

  private _validateBeforeChangingStep(step: MatStep, prevStep: MatStep | undefined, index: number) {
    const selectFunction = step.select;
    step.select = () => {
      if (this.activeSteps[index].state === 'LOCKED') {
        return;
      } else if ((prevStep?.stepControl?.valid || prevStep === undefined) && index !== this.stepper.selectedIndex) {
        if (this._hasUnsavedChanges()) {
          this._callUnsavedChangesModal(index, selectFunction);
        } else {
          // Call the original select function
          selectFunction.apply(step);
        }
      }
    };
  }

  private _callUnsavedChangesModal(index: number, selectFunction: () => void) {
    const step = this.stepper.steps.get(index);

    this._unsavedChangesService
      .openConfirmationModal$(
        () => selectFunction.apply(step),
        () => this.saveAndContinue.emit(index),
      )
      .subscribe();
  }

  private _hasUnsavedChanges() {
    const modelStr = stringifyModel(this.model);

    return this.modelSnapshot != modelStr;
  }
}
