import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActiveTaskAction,
  FormConfigurationModel,
  FormModel,
  TransactionModel,
  UpdateTransactionOptions,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { FooterAction, IFormError, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { BehaviorSubject, EMPTY, Observable, ReplaySubject, Subject, catchError, filter, forkJoin, map, of, tap } from 'rxjs';
import { BaseFooterActions } from '../components/steps/formly/formly-step.model';

@Injectable({
  providedIn: 'root',
})
export class FormRendererService {
  /**
   * The transaction data
   */
  public transaction$: Observable<TransactionModel>;
  /**
   * FormErrors used to populate the form errors section above the form
   */
  public formErrors$: Observable<IFormError[]>;
  public completeEdit$: Observable<void>;

  /**
   * The form configuration used to render the form
   */
  public formConfiguration$: Observable<FormConfigurationModel>;

  /**
   * The form configuration used to render the modal form
   */
  public modalFormConfiguration$: Observable<FormConfigurationModel>;

  /**
   * An observable that emits to notify to close the modal.
   */
  public closeModal$: Observable<void>;

  public modalActions$: Observable<FooterAction[]>;
  public isModalOpen$: Observable<boolean>;

  private readonly _transactionId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private readonly _transaction: BehaviorSubject<TransactionModel> = new BehaviorSubject<TransactionModel>(new TransactionModel());
  private readonly _form: BehaviorSubject<FormModel> = new BehaviorSubject<FormModel>(new FormModel());
  private readonly _taskId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private readonly _formErrors: BehaviorSubject<IFormError[]> = new BehaviorSubject<IFormError[]>([]);
  private readonly _completeEdit: Subject<void> = new Subject<void>();
  private _unsaved = false;
  private readonly _modalFormConfiguration: ReplaySubject<FormConfigurationModel | undefined> = new ReplaySubject<FormConfigurationModel | undefined>(1);
  private readonly _closeModal: Subject<void> = new Subject<void>();
  private readonly _modalActions: ReplaySubject<FooterAction[]> = new ReplaySubject<FooterAction[]>(1);
  private readonly _isModalOpen: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _router: Router,
  ) {
    this.completeEdit$ = this._completeEdit.asObservable();
    this.transaction$ = this._transaction.asObservable();
    this.formConfiguration$ = this._form.asObservable().pipe(
      filter(formModel => !!formModel.formConfigurationModel),
      map(formModel => formModel.formConfigurationModel),
    );
    this.formErrors$ = this._formErrors.asObservable();
    this.modalFormConfiguration$ = this._modalFormConfiguration.asObservable().pipe(
      filter(formConfigurationModel => !!formConfigurationModel),
      map(formConfigurationModel => formConfigurationModel as FormConfigurationModel),
    );
    this.closeModal$ = this._closeModal.asObservable();
    this.modalActions$ = this._modalActions.asObservable();
    this.isModalOpen$ = this._isModalOpen.asObservable();
  }

  /**
   * TransactionId getter, only used when you need the transactionId now
   */
  public get transactionId() {
    return this._transactionId.value;
  }

  /**
   * Transaction getter, only used when you need the value of a transaction now
   */
  public get transaction() {
    return this._transaction.value;
  }

  /**
   * Update the transaction behavior subject
   */
  public set transaction(value: TransactionModel) {
    this._transaction.next(value);
  }

  /**
   * From configuration getter, only used when you need the value of a form now
   */
  public get formConfiguration() {
    return this._form.value.formConfigurationModel;
  }

  public set isModalOpen(value: boolean) {
    this._isModalOpen.next(value);
  }

  public completeEdit() {
    this._completeEdit.next();
  }

  /**
   * Load the transaction and formConfiguration
   */
  public loadTransactionDetails$(transactionId: string, saved?: boolean): Observable<[FormModel, TransactionModel | undefined]> {
    if (saved != undefined && !saved) {
      this._unsaved = true;
    }
    this._transactionId.next(transactionId);

    return forkJoin([this._getFormConfiguration$(), this._getTransaction$()]);
  }

  public getModalConfiguration$(action: ActiveTaskAction): Observable<FormConfigurationModel> {
    return this._workApiRoutesService.getFormByTransactionId$(this._transactionId.value, undefined, action.modalContext).pipe(
      map(formModel => formModel.formConfigurationModel),
      filter(formConfigurationModel => !!formConfigurationModel),
      tap(() => this._modalActions.next([action, BaseFooterActions.closeModal])),
      tap(formConfigurationModel => this._modalFormConfiguration.next(formConfigurationModel)),
    );
  }

  /**
   * Update the transaction
   */
  public updateTransaction$(completeTask?: boolean, formStepKey?: string, action?: string): Observable<TransactionModel> {
    const updateOptions: UpdateTransactionOptions = {
      completeTask: completeTask,
      formStepKey: formStepKey,
      taskId: this._taskId.value,
      transaction: this._transaction.value.toDataSchema(action),
      transactionId: this._transactionId.value,
    };

    if (this._unsaved) {
      return this.createTransaction$(this._transactionId.value, action);
    }

    return this._workApiRoutesService.updateTransactionById$(updateOptions).pipe(
      tap(transactionModel => {
        this._transaction.next(transactionModel);
      }),
    );
  }

  public createTransaction$(transactionKey: string, action?: string): Observable<TransactionModel> {
    return this._workApiRoutesService.createTransaction$(transactionKey, this._transaction.value.toDataSchema(action)).pipe(
      tap(transactionModel => {
        this._router.navigate([`/dashboard/transaction/${transactionModel.id}`], { queryParams: { 'first-save': 'true' } });
        this._unsaved = false;
        this._transaction.next(transactionModel);
      }),
      catchError(_error => {
        this._nuverialSnackBarService.notifyApplicationError();

        return EMPTY;
      }),
    );
  }

  /**
   * Set the form configuration manually when configuration is not tied to transaction (builder)
   */
  public setFormConfiguration(formConfigurationModel: FormConfigurationModel) {
    const formModel = this._form.value;
    formModel.formConfigurationModel = formConfigurationModel;
    this._form.next(formModel);
  }

  /**
   * Set the form errors
   */
  public setFormErrors(errors: IFormError[]) {
    this._formErrors.next(errors);
  }

  /**
   * Reset form errors
   */
  public resetFormErrors() {
    this._formErrors.next([]);
  }

  /**
   * clean up and reset state
   */
  public cleanUp() {
    this._formErrors.next([]);
    this._transactionId.next('');
    this._transaction.next(new TransactionModel());
    this._form.next(new FormModel());
  }

  /**
   * clean up and reset modal state
   */
  public cleanUpModal() {
    this._formErrors.next([]);
    this._modalFormConfiguration.next(undefined);
    this._isModalOpen.next(false);
  }

  /**
   * Closes the modal.
   */
  public closeModal() {
    this._closeModal.next();
  }

  private _getFormConfiguration$(): Observable<FormModel> {
    if (this._unsaved) {
      return this._workApiRoutesService.getFormConfiguration$(this._transactionId.value).pipe(
        tap(formModel => {
          this._form.next(formModel);
          this._taskId.next(formModel.taskName);
        }),
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
      );
    }

    return this._workApiRoutesService.getFormByTransactionId$(this._transactionId.value).pipe(
      tap(formModel => {
        this._form.next(formModel);
        this._taskId.next(formModel.taskName);
      }),
    );
  }

  private _getTransaction$(): Observable<TransactionModel | undefined> {
    if (this._unsaved) {
      return of(undefined);
    }

    return this._workApiRoutesService.getTransactionById$(this._transactionId.value).pipe(tap(transactionModel => this._transaction.next(transactionModel)));
  }
}
