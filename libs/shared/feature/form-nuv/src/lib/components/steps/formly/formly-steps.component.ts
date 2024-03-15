import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { CONFIRMATION_STEP_KEY, TransactionModel } from '@dsg/shared/data-access/work-api';
import {
  FooterAction,
  GetAllFormErrors,
  IFormError,
  INuverialPanel,
  IStep,
  IStepEvent,
  MarkAllControlsAsTouched,
  NuverialAccordionComponent,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialFormErrorsComponent,
  NuverialIconComponent,
  NuverialSnackBarService,
  NuverialStepperComponent,
  NuverialStepperKeyDirective,
  StepperFadeInOut,
  stringifyModel,
  TitleService,
  UnsavedChangesService,
} from '@dsg/shared/ui/nuverial';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { catchError, EMPTY, finalize, Observable, take, tap } from 'rxjs';
import { FormRendererService } from '../../../services/form-renderer.service';
import { FormlyBaseComponent } from '../../base';
import { FormStateContext, FormStateMode, FormStateStepperMode } from '../../forms';
import { Actions, BaseFooterActions, FormlyStepFieldProperties } from './formly-step.model';

@UntilDestroy()
@Component({
  animations: [StepperFadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormlyModule,
    NuverialStepperComponent,
    NuverialButtonComponent,
    NuverialIconComponent,
    NuverialAccordionComponent,
    MatStepperModule,
    NuverialStepperKeyDirective,
    NuverialFormErrorsComponent,
    NuverialFooterActionsComponent,
  ],
  selector: 'dsg-formly-steps',
  standalone: true,
  styleUrls: ['./formly-steps.component.scss'],
  templateUrl: './formly-steps.component.html',
})
export class FormlyStepsComponent extends FormlyBaseComponent implements OnInit, OnDestroy {
  @ViewChild(NuverialStepperComponent) public nuvStepper!: NuverialStepperComponent;

  public returnToReviewStep = false;
  public confirmationStepKey = CONFIRMATION_STEP_KEY;
  public steps: IStep[] = [];
  public formStateStepperMode = FormStateStepperMode;
  public formStateContext = FormStateContext;

  public isConfirmationStep = false;
  public updatingTransaction = false;
  public formErrors$: Observable<IFormError[]> = this._formRendererService.formErrors$;

  public footerActions: FooterAction[] = [];
  public modalActions$: Observable<FooterAction[]> = this._formRendererService.modalActions$;
  public isModalOpen$: Observable<boolean> = this._formRendererService.isModalOpen$;

  public agencyEditActions: FooterAction[] = [
    { key: 'update', uiClass: 'Primary', uiLabel: 'Save' },
    { key: 'cancel', uiClass: 'Secondary', uiLabel: 'cancel' },
  ];
  public loadFooterActions$ = this._formRendererService.transaction$.pipe(
    // We currently assume that there can be a maximum of one active task
    tap(transaction => {
      if (transaction.activeTasks.length && transaction.activeTasks[0].actions.length) {
        // Only one action so far
        this._activeTaskActions = transaction.activeTasks[0].actions;
      }
    }),
  );

  private _initialFormStateMode!: FormStateMode;

  // Intake form limited to only one activeTask, can have multiple actions at the end of the form
  private _activeTaskActions: FooterAction[] = [];

  constructor(
    private readonly _router: Router,
    private readonly _formRendererService: FormRendererService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _titleService: TitleService,
    private readonly _unsavedChangesService: UnsavedChangesService,
  ) {
    super();
    this.loadFooterActions$.pipe(untilDestroyed(this)).subscribe();
  }

  /**
   * The panel list used on the confirmation/review step of the intake form
   */
  public get confirmationPanelList(): INuverialPanel[] {
    return (
      this.activeFieldGroups
        .filter((step: FormlyFieldConfig<FormlyStepFieldProperties>) => step.props?.stepKey !== CONFIRMATION_STEP_KEY)
        .map(step => ({
          expanded: true,
          id: step.props?.['stepKey'],
          panelTitle: step.props?.label,
        })) || []
    );
  }

  /**
   * The panel list used on the confirmation/review step of the intake form
   */
  public get reviewModePanelList(): INuverialPanel[] {
    return (
      this.activeFieldGroups.map(step => ({
        expanded: true,
        id: step.props?.['stepKey'],
        panelTitle: step.props?.label,
      })) || []
    );
  }

  public get activeFieldGroups(): FormlyFieldConfig[] {
    return this.field.fieldGroup?.filter((step: FormlyFieldConfig<FormlyStepFieldProperties>) => !step.hide) || [];
  }

  public get stepperMode(): FormStateStepperMode {
    return this.formState.stepperMode;
  }

  public get formContext(): FormStateContext {
    return this.formState.context;
  }

  public get modelSnapshot(): string {
    return this._unsavedChangesService.modelSnapshot;
  }

  @HostListener('window:beforeunload', ['$event'])
  public beforeUnloadHandler(event: BeforeUnloadEvent) {
    if (this.formContext !== FormStateContext.AdminBuilder && this._unsavedChangesService.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  public ngOnInit(): void {
    this._initialFormStateMode = this.mode;
    this.steps = this._retrieveSteps();
    const params = this._activeRoute.snapshot.queryParams;

    if (params['resume'] === 'true') {
      Promise.resolve().then(() => this._goToFirstInvalidStep());
    }
    if (params['first-save'] === 'true') {
      Promise.resolve().then(() => this.nuvStepper.stepper.next());
    }
    this._unsavedChangesService.modelSnapshot = stringifyModel(this.model);
    Promise.resolve().then(() => (this.footerActions = this._retrieveActions(this.nuvStepper?.stepper?.selectedIndex || 0)));

    const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.activeFieldGroups[0] || {};

    if (this._formRendererService.transaction.transactionDefinitionName && this.mode !== FormStateMode.Review) {
      this._titleService.setHtmlTitle(`${this._formRendererService.transaction.transactionDefinitionName} - ${stepField?.props?.label}`);
    }

    this._unsavedChangesService.model = this.model;

    this._unsavedChangesService.saveAndContinue$
      .pipe(
        tap(_ => {
          if (this.nuvStepper) {
            this.onSave('next');
          } else {
            this.onSave('update');
          }
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this.mode = this._initialFormStateMode;
    this._formRendererService.resetFormErrors();
    this._unsavedChangesService.modelSnapshot = '';
    this._unsavedChangesService.model = {};
  }

  public trackByFn(_index: number, item: FormlyFieldConfig) {
    return item.id;
  }

  /**
   * Event handler for when the the footer action buttons are clicked
   */
  public onActionClick(event: string) {
    switch (event) {
      case Actions.next:
        this.onSave('next');
        break;
      case Actions.previous:
        this.onSave('previous');
        break;
      case Actions.update:
        this.onSave('update');
        break;
      case Actions.cancel:
        this._formRendererService.completeEdit();
        this.mode = FormStateMode.Review;
        this.options.resetModel?.();
        this._formRendererService.resetFormErrors();
        break;
      case Actions.closeModal:
        this._formRendererService.closeModal();
        break;
      default:
        this.onSave('complete', undefined, event);
        break;
    }
  }

  /** Used by the confirmation step to go to another step to edit, should return back to the confirmation step after the user saves */
  public goToStepByKey(stepKey: string) {
    const stepIndex: number = this.activeFieldGroups.findIndex((step: FormlyFieldConfig<FormlyStepFieldProperties>) => step.props?.stepKey === stepKey) ?? -1;

    if (stepIndex === -1) return;

    this.returnToReviewStep = true;
    this.nuvStepper.stepper.selectedIndex = stepIndex;
  }

  public updateModeByStep(stepEvent: IStepEvent) {
    const fieldGroupLength = this.activeFieldGroups.length || 0;
    this.returnToReviewStep = stepEvent.prevStep === fieldGroupLength - 1 && this.returnToReviewStep;

    if (this.formContext !== FormStateContext.AdminBuilder) {
      this.options.resetModel?.();
    } else {
      // To allow for free navigation in the admin builder to trigger the hidden step updates
      this._updateHiddenSteps();
    }
    this.updateMode(stepEvent.nextStep);
  }

  public updateMode(selectedStep: number) {
    const field: FormlyFieldConfig<FormlyStepFieldProperties> = this.activeFieldGroups[selectedStep] || {};
    this._formRendererService.resetFormErrors();

    if (this._formRendererService.transaction.transactionDefinitionName) {
      this._titleService.setHtmlTitle(`${this._formRendererService.transaction.transactionDefinitionName} - ${field?.props?.label}`);
    }

    if (field.props?.stepKey === CONFIRMATION_STEP_KEY) {
      this.mode = FormStateMode.Review;
      this.isConfirmationStep = true;
    } else {
      this.mode = this._initialFormStateMode;
      this.isConfirmationStep = false;
    }

    this.footerActions = this._retrieveActions(selectedStep);
  }

  public onSave(action: 'next' | 'previous' | 'complete' | 'stepChange' | 'update' | 'validate', goTo?: number, event?: string): void {
    const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.activeFieldGroups[this.nuvStepper?.stepper.selectedIndex] || {};

    switch (action) {
      case 'previous':
        this._goToPreviousStepOrSave();
        break;
      case 'next':
        this._partialSaveAndChangeStep(stepField, this.nuvStepper.stepper.selectedIndex + 1);
        break;
      case 'stepChange':
        if (goTo !== undefined) {
          this._partialSaveAndChangeStep(stepField, goTo);
        }

        break;
      case 'complete':
        if (!this.steps.filter(step => !step.hidden && step.stepKey !== CONFIRMATION_STEP_KEY).every(step => step.form?.valid)) {
          this._handleFormErrors(this.field, this.form);
          MarkAllControlsAsTouched(this.form);

          return;
        }

        this._saveTransaction(true, undefined, event)
          .pipe(
            tap(transaction => {
              if (this.formContext === FormStateContext.PublicPortal) {
                transaction && this._router.navigate(['submitted'], { relativeTo: this._activeRoute });
                this.returnToReviewStep = false;
              }
            }),
            take(1),
          )
          .subscribe();

        break;
      case 'update':
        if (!this.steps.filter(step => !step.hidden && step.stepKey !== CONFIRMATION_STEP_KEY).every(step => step.form?.valid)) {
          this._handleFormErrors(this.field, this.form);
          MarkAllControlsAsTouched(this.form);

          return;
        }

        this._saveTransaction(false)
          .pipe(
            take(1),
            tap(() => {
              this._formRendererService.completeEdit();
              this.mode = FormStateMode.Review;
            }),
          )
          .subscribe();

        break;
      case 'validate':
        this._validateStep(stepField);

        break;
    }
  }

  /**
   * Validates a step field.
   *
   * @param stepField - The FormlyFieldConfig representing the step field.
   * @returns A boolean indicating whether the step field is valid.
   */
  private _validateStep(stepField: FormlyFieldConfig<FormlyStepFieldProperties>): boolean {
    const stepForm = this._getAllControlsFromStep(stepField);
    const step = this.steps.find(_step => _step.stepKey === stepField.props?.stepKey);

    if (!stepForm?.valid) {
      this._handleFormErrors(stepField, stepForm);
      MarkAllControlsAsTouched(stepForm);

      return false;
    }

    // Clear form errors if valid
    this._formRendererService.setFormErrors([]);

    if (step) {
      step.form = stepForm;
      this._updateHiddenSteps();
    }

    return true;
  }

  private _goToPreviousStepOrSave() {
    if (this._unsavedChangesService.hasUnsavedChanges) {
      this._unsavedChangesService
        .openConfirmationModal$(
          () => this._goToPreviousStep(),
          () => this.onSave('stepChange', this.nuvStepper.stepper.selectedIndex - 1),
        )
        .pipe(take(1))
        .subscribe();
    } else {
      this._goToPreviousStep();
    }
  }

  private _partialSaveAndChangeStep(stepField: FormlyFieldConfig<FormlyStepFieldProperties>, goTo: number) {
    if (!this._validateStep(stepField)) {
      return;
    }

    this._saveTransaction(false, stepField.props?.stepKey)
      .pipe(
        tap(() => {
          if (this.returnToReviewStep) {
            this._goToFirstInvalidStep();
          } else {
            this.nuvStepper.stepper.selectedIndex = goTo;
          }

          this.updateMode(this.nuvStepper.stepper.selectedIndex);
        }),
        take(1),
      )
      .subscribe();
  }

  private _retrieveActions(selectedStep: number): FooterAction[] {
    const actions = [];
    const fieldGroupLength = this.activeFieldGroups.length || 0;

    // Rightmost button
    if (selectedStep === fieldGroupLength - 1) {
      actions.push(...this._activeTaskActions);
    }
    // Middle button
    if (selectedStep < fieldGroupLength - 1) {
      actions.push(BaseFooterActions.next);
    }
    // Leftmost button
    if (selectedStep !== 0 || this.returnToReviewStep) {
      actions.push(BaseFooterActions.previous);
    }

    return actions;
  }

  private _updateHiddenSteps(): void {
    this.steps.forEach(step => {
      const foundStep = this.field.fieldGroup?.find(fieldStep => fieldStep.props?.['stepKey'] === step.stepKey);

      if (step.hidden !== !!foundStep?.hide) {
        step.hidden = !!foundStep?.hide;
        if (Object.keys((step.form as FormGroup).controls).length === 0 && foundStep) {
          step.form = this._getAllControlsFromStep(foundStep);
        }
      }
    });
  }

  private _goToFirstInvalidStep(): void {
    const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.activeFieldGroups[this.nuvStepper.stepper.selectedIndex] || {};
    const stepKey = stepField.props?.stepKey || '';

    if (stepKey != CONFIRMATION_STEP_KEY) {
      const stepForm = this._getAllControlsFromStep(stepField);

      if (!stepForm?.valid) {
        this._handleFormErrors(stepField, stepForm);
        MarkAllControlsAsTouched(stepForm);

        return;
      }
      this.nuvStepper.stepper.next();
      this._goToFirstInvalidStep();
    }
  }

  private _retrieveSteps(): IStep[] {
    return (
      this.field.fieldGroup?.map(step => {
        const stepKey = step.props?.['stepKey'];
        const form = stepKey === CONFIRMATION_STEP_KEY ? undefined : this._getAllControlsFromStep(step);

        return {
          form,
          hidden: !!step.hide,
          label: step.props?.label || '',
          stepKey,
        };
      }) || []
    );
  }

  private _handleFormErrors(stepField: FormlyFieldConfig<FormlyStepFieldProperties>, stepForm: AbstractControl | null): void {
    if (!stepForm) return;

    const formErrors = Object.entries(GetAllFormErrors(stepForm) || [])
      .map(([key, errorName]) => {
        const controlName = `${key}`;
        const field = stepField.get?.(controlName);
        const id = `${controlName}-field`;

        if (!field) return;

        return {
          controlName,
          errorName,
          id,
          label: this._getComponentLabel(String(field?.key) || ''),
        };
      })
      .filter((error): error is IFormError => error !== undefined);

    this._formRendererService.setFormErrors(formErrors);
  }

  private _getComponentLabel(key: string): string {
    const formElement = this._formRendererService.formConfiguration.getComponentDataByKey(key);
    let label = formElement.label;
    const component = formElement.component;

    if (component?.props?.formErrorLabel) {
      label = component?.props?.formErrorLabel;
    }

    return label;
  }

  private _saveTransaction(completeTask?: boolean, formStepKey?: string, action?: string): Observable<TransactionModel | void> {
    this._formRendererService.resetFormErrors();
    this.updatingTransaction = true;

    this._unsavedChangesService.setSaving();
    const snapshot = stringifyModel(this.model);

    return this._formRendererService.updateTransaction$(completeTask, formStepKey, action).pipe(
      tap(_ => {
        this.updatingTransaction = false;
        this.options.updateInitialValue?.();

        const selectedIndex = this.nuvStepper?.stepper.selectedIndex;

        if (selectedIndex && this.steps[selectedIndex]) {
          this.steps[selectedIndex].state = 'SAVED';
        }
        if (selectedIndex && this.steps[selectedIndex + 1]?.state === 'LOCKED') {
          this.steps[selectedIndex + 1].state = 'UNLOCKED';
        }

        this._unsavedChangesService.modelSnapshot = snapshot;

        this._formRendererService.closeModal();
      }),
      finalize(() => {
        this._unsavedChangesService.setNotSaving();
      }),
      catchError(_error => {
        this.updatingTransaction = false;
        this._unsavedChangesService.setNotSaving();

        if (_error?.error?.formioValidationErrors) {
          const stepField: FormlyFieldConfig<FormlyStepFieldProperties> = this.activeFieldGroups[this.nuvStepper.stepper.selectedIndex] || {};
          const mappedErrors: IFormError[] = _error.error.formioValidationErrors.map(({ controlName, errorName }: IFormError) => {
            const formlyFormattedControlName = this._formlyFormatControlName(controlName);

            const field = stepField.get?.(formlyFormattedControlName);
            const control = this.form.get?.(formlyFormattedControlName);
            control?.setErrors({ [errorName]: true });

            return {
              controlName: formlyFormattedControlName,
              errorName: errorName,
              id: `${formlyFormattedControlName}-field`,
              label: this._formRendererService.formConfiguration.getComponentLabelByKey((field?.key || '').toString()),
            };
          });

          this._formRendererService.setFormErrors(mappedErrors);
          MarkAllControlsAsTouched(this.form);

          return EMPTY;
        }

        this._nuverialSnackBarService.notifyApplicationError();

        return EMPTY;
      }),
    );
  }

  private _formlyFormatControlName(controlName: string): string {
    return controlName.replace(/\[(\d+)\]/g, '.$1');
  }

  private _getAllControlsFromStep(stepField: FormlyFieldConfig<FormlyStepFieldProperties>): FormGroup {
    const formGroup = new FormGroup({});

    const getControlsRecursively = (field: FormlyFieldConfig<FormlyStepFieldProperties>): void => {
      if (field.hide) return;

      for (const nestedField of field?.fieldGroup || []) {
        if (nestedField.hide) continue;

        const key = nestedField.key?.toString() || '';
        const control = this.form.get(key);

        if (control instanceof FormControl) {
          formGroup.addControl(key, control);
        }

        if (control instanceof FormArray) {
          formGroup.addControl(key, control);

          continue;
        }

        if (nestedField.fieldGroup?.length) {
          getControlsRecursively(nestedField);
        }
      }
    };

    getControlsRecursively(stepField);

    return formGroup;
  }

  private _goToPreviousStep() {
    this.options.resetModel?.();
    this._formRendererService.resetFormErrors();

    if (this.returnToReviewStep) {
      this.nuvStepper.stepper.selectedIndex = this.activeFieldGroups.length - 1;
      this.returnToReviewStep = false;
    } else {
      this.nuvStepper.stepper.previous();
    }

    this.updateMode(this.nuvStepper.stepper.selectedIndex);
  }
}
