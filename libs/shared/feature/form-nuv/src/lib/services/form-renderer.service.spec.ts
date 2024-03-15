import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  ActiveTaskAction,
  FormConfigurationModel,
  FormModel,
  FormModelMock,
  TransactionMock,
  TransactionModel,
  TransactionModelMock,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { BaseFooterActions } from '../components/steps/formly/formly-step.model';
import { FormRendererService } from './form-renderer.service';

const transactionModelMock = new TransactionModel(TransactionMock);

describe('FormRendererService', () => {
  let service: FormRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(WorkApiRoutesService, {
          getFormByTransactionId$: jest.fn().mockImplementation(() => of(FormModelMock)),
          getFormConfiguration$: jest.fn().mockImplementation(() => of(FormModelMock)),
          getTransactionById$: jest.fn().mockImplementation(() => of(transactionModelMock)),
          updateTransactionById$: jest.fn().mockImplementation(() => of(transactionModelMock)),
          createTransaction$: jest.fn().mockImplementation(() => of(transactionModelMock)),
        }),
        MockProvider(NuverialSnackBarService),
        MockProvider(Router),
      ],
    });
    service = TestBed.inject(FormRendererService);
    service['_transactionId'].next('testId');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get transactionId', () => {
    service['_transactionId'].next('testId');
    const result = service.transactionId;
    expect(result).toBe('testId');
  });

  it('should set transactions', () => {
    const testTransaction = TransactionModelMock;
    testTransaction.id = 'testId';

    service.transaction = testTransaction;

    service.transaction$.subscribe(transaction => {
      expect(transaction).toEqual(testTransaction);
    });
  });

  it('should emit a value when completeEdit() is called', () => {
    const completeEditSpy = jest.spyOn(service['_completeEdit'], 'next');
    service.completeEdit();
    expect(completeEditSpy).toHaveBeenCalled();
  });

  describe('_getFormConfiguration$', () => {
    it('should get a formConfigurationModel by Id if transaction is saved', done => {
      service['_unsaved'] = false;
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getFormByTransactionId$Spy = jest.spyOn(workApiService, 'getFormByTransactionId$');
      const _formSpy = jest.spyOn(service['_form'], 'next');

      service['_transactionId'].next('testId');
      service['_getFormConfiguration$']().subscribe(formModel => {
        expect(formModel).toEqual(FormModelMock);
        expect(getFormByTransactionId$Spy).toHaveBeenCalledWith('testId');
        expect(_formSpy).toBeCalledWith(FormModelMock);

        done();
      });
    });

    it('should get formConfigurationModel by name if transaction is unsaved', done => {
      service['_unsaved'] = true;
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getFormConfiguration$Spy = jest.spyOn(workApiService, 'getFormConfiguration$');
      const _formSpy = jest.spyOn(service['_form'], 'next');

      service['_transactionId'].next('testId');
      service['_getFormConfiguration$']().subscribe(formModel => {
        expect(formModel).toEqual(FormModelMock);
        expect(getFormConfiguration$Spy).toHaveBeenCalledWith('testId');
        expect(_formSpy).toBeCalledWith(FormModelMock);

        done();
      });
    });

    it('should get formConfigurationModel by name if transaction is unsaved', done => {
      service['_unsaved'] = true;
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getFormConfiguration$Spy = jest.spyOn(workApiService, 'getFormConfiguration$');
      const _formSpy = jest.spyOn(service['_form'], 'next');

      service['_transactionId'].next('testId');
      service['_getFormConfiguration$']().subscribe(formModel => {
        expect(formModel).toEqual(FormModelMock);
        expect(getFormConfiguration$Spy).toHaveBeenCalledWith('testId');
        expect(_formSpy).toBeCalledWith(FormModelMock);

        done();
      });
    });

    it('should handle error when transaction is unsaved', fakeAsync(() => {
      service['_unsaved'] = true;
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getFormConfiguration$Spy = jest.spyOn(workApiService, 'getFormConfiguration$').mockReturnValue(throwError(() => 'Test Error'));
      const snackBarSpy = ngMocks.findInstance(NuverialSnackBarService);
      const notifySpy = jest.spyOn(snackBarSpy, 'notifyApplicationError');
      const _formSpy = jest.spyOn(service['_form'], 'next');

      service['_transactionId'].next('testId');
      service['_getFormConfiguration$']().subscribe({
        error: _error => {
          expect(getFormConfiguration$Spy).toHaveBeenCalledWith('testId');
          expect(_formSpy).not.toBeCalled();
          expect(notifySpy).toBeCalled();
        },
      });
      tick();
    }));
  });

  describe('_getTransaction$', () => {
    it('should get a transactionModel', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'getTransactionById$');
      const _transactionSpy = jest.spyOn(service['_transaction'], 'next');

      service['_transactionId'].next('testId');
      service['_getTransaction$']().subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith('testId');
        expect(_transactionSpy).toBeCalledWith(transactionModelMock);

        done();
      });
    });
  });

  describe('transaction$', () => {
    it('should get transactionData', done => {
      service['_getTransaction$']().subscribe();

      service.transaction$.subscribe(transactionModel => {
        expect(transactionModel.data).toEqual(transactionModelMock.data);

        done();
      });
    });
  });

  describe('formConfiguration$', () => {
    it('should get formConfiguration', done => {
      service['_getFormConfiguration$']().subscribe();

      service.formConfiguration$.subscribe(formConfiguration => {
        expect(formConfiguration).toEqual(FormModelMock.formConfigurationModel);

        done();
      });
    });
  });

  describe('loadTransactionDetails$', () => {
    it('should load transaction details', done => {
      service['_unsaved'] = false;
      service.loadTransactionDetails$('testId').subscribe();

      service.transaction$.subscribe(transactionModel => {
        expect(service['_transactionId'].value).toEqual('testId');
        expect(transactionModel.data).toEqual(transactionModelMock.data);

        done();
      });
    });

    it('should set _unsaved to true if given', done => {
      service['_unsaved'] = false;
      service.loadTransactionDetails$('testId', false).subscribe();

      service.transaction$.subscribe(_ => {
        expect(service['_unsaved']).toEqual(true);

        done();
      });
    });

    it('should load form configuration', done => {
      service.loadTransactionDetails$('testId').subscribe();

      service.formConfiguration$.subscribe(formConfiguration => {
        expect(service['_transactionId'].value).toEqual('testId');
        expect(formConfiguration).toEqual(FormModelMock.formConfigurationModel);

        done();
      });
    });
  });

  describe('updateTransaction$', () => {
    it('should update the transaction if it has been saved', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'updateTransactionById$');
      const _transactionSpy = jest.spyOn(service['_transaction'], 'next');

      service['_transactionId'].next('testId');
      service.updateTransaction$().subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(_transactionSpy).toBeCalledWith(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith(expect.objectContaining({ transaction: { data: {} }, transactionId: 'testId' }));
        done();
      });
    });

    it('should create the transaction if it has not been saved', done => {
      service['_unsaved'] = true;
      const spy = jest.spyOn(service, 'createTransaction$');
      service['_transactionId'].next('testId');

      service.updateTransaction$().subscribe(_ => {
        expect(spy).toBeCalledWith('testId', undefined);
        done();
      });
    });
  });

  describe('createTransaction$', () => {
    it('should create transaction with current value', done => {
      service.createTransaction$('FinancialBenefit');
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const spy = jest.spyOn(workApiService, 'createTransaction$');
      const routerService = ngMocks.findInstance(Router);
      const routerSpy = jest.spyOn(routerService, 'navigate');

      service.createTransaction$('FinancialBenefit').subscribe(transactionModel => {
        expect(spy).toBeCalled();
        expect(routerSpy).toHaveBeenCalledWith([`/dashboard/transaction/${transactionModel.id}`], { queryParams: { 'first-save': 'true' } });
        expect(transactionModel).toEqual(transactionModelMock);
        done();
      });
    });

    it('should handle error on create', fakeAsync(() => {
      service.createTransaction$('FinancialBenefit');
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const spy = jest.spyOn(workApiService, 'createTransaction$').mockReturnValue(throwError(() => 'Test Error'));
      const snackBarSpy = ngMocks.findInstance(NuverialSnackBarService);
      const notifySpy = jest.spyOn(snackBarSpy, 'notifyApplicationError');

      service.createTransaction$('FinancialBenefit').subscribe(transactionModel => {
        expect(spy).toBeCalled();
        expect(transactionModel).toEqual(transactionModelMock);
        expect(notifySpy).toBeCalled();
      });
    }));
  });

  describe('updateTransactionPriority', () => {
    it('should update the transaction with taskId', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'updateTransactionById$');
      const _transactionSpy = jest.spyOn(service['_transaction'], 'next');

      service['_transactionId'].next('testId');
      service['_taskId'].next('testId');
      service.updateTransaction$(true).subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(_transactionSpy).toBeCalledWith(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith({
          completeTask: true,
          formStepKey: undefined,
          taskId: 'testId',
          transaction: { data: {} },
          transactionId: 'testId',
        });

        done();
      });
    });
  });

  it('should set _form', () => {
    const spy = jest.spyOn(service['_form'], 'next');
    const formConfigurationModel = new FormConfigurationModel();
    const formModel = new FormModel();
    formModel.formConfigurationModel = formConfigurationModel;

    service.setFormConfiguration(formConfigurationModel);

    expect(spy).toHaveBeenCalledWith(formModel);
  });

  it('should set form errors', () => {
    const spy = jest.spyOn(service['_formErrors'], 'next');

    service.setFormErrors([]);

    expect(spy).toHaveBeenCalledWith([]);
  });

  it('should reset form errors', () => {
    const spy = jest.spyOn(service['_formErrors'], 'next');

    service.resetFormErrors();

    expect(spy).toHaveBeenCalledWith([]);
  });

  it('should cleanup service state', () => {
    jest.spyOn(service['_formErrors'], 'next');
    jest.spyOn(service['_transactionId'], 'next');
    jest.spyOn(service['_transaction'], 'next');
    jest.spyOn(service['_form'], 'next');

    service.cleanUp();

    expect(service['_formErrors'].next).toHaveBeenCalledWith([]);
    expect(service['_transactionId'].next).toHaveBeenCalledWith('');
    expect(service['_transaction'].next).toHaveBeenCalledWith(new TransactionModel());
    expect(service['_form'].next).toHaveBeenCalledWith(new FormModel());
  });

  it('should cleanup service modal state', () => {
    jest.spyOn(service['_formErrors'], 'next');
    jest.spyOn(service['_modalFormConfiguration'], 'next');
    jest.spyOn(service['_isModalOpen'], 'next');

    service.cleanUpModal();

    expect(service['_formErrors'].next).toHaveBeenCalledWith([]);
    expect(service['_modalFormConfiguration'].next).toHaveBeenCalledWith(undefined);
    expect(service['_isModalOpen'].next).toHaveBeenCalledWith(false);
  });

  it('should emit close modal', () => {
    jest.spyOn(service['_closeModal'], 'next');

    service.closeModal();

    expect(service['_closeModal'].next).toHaveBeenCalled();
  });

  describe('transaction', () => {
    it('should return the transaction', () => {
      service['_transaction'].next(transactionModelMock);

      expect(service.transaction).toEqual(transactionModelMock);
    });

    it('should set the transaction', () => {
      jest.spyOn(service['_transaction'], 'next');

      service.transaction = transactionModelMock;

      expect(service['_transaction'].next).toHaveBeenCalledWith(transactionModelMock);
    });

    it('should return the transactionId', () => {
      service['_transactionId'].next('testId');

      expect(service.transactionId).toEqual('testId');
    });
  });

  it('should set isModalOpen', () => {
    jest.spyOn(service['_isModalOpen'], 'next');

    service.isModalOpen = true;

    expect(service['_isModalOpen'].next).toHaveBeenCalledWith(true);
  });

  it('should get formConfiguration', () => {
    service['_form'].next(FormModelMock);

    expect(service.formConfiguration).toEqual(FormModelMock.formConfigurationModel);
  });

  it('should emit completeEdit', () => {
    const spy = jest.spyOn(service['_completeEdit'], 'next');

    service.completeEdit();

    expect(spy).toHaveBeenCalled();
  });

  describe('getModalConfiguration$', () => {
    it('should get the modal configuration', done => {
      const action: Partial<ActiveTaskAction> = {
        modalContext: 'testModalContext',
        // Add other properties as needed
      };

      const formModelMock: Partial<FormModel> = {
        formConfigurationModel: new FormConfigurationModel(),
        // Add other properties as needed
      };

      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getFormByTransactionId$Spy = jest.spyOn(workApiService, 'getFormByTransactionId$').mockReturnValueOnce(of(formModelMock as FormModel));
      const _modalActionsSpy = jest.spyOn(service['_modalActions'], 'next');
      const _modalFormConfigurationSpy = jest.spyOn(service['_modalFormConfiguration'], 'next');

      service.getModalConfiguration$(action as ActiveTaskAction).subscribe(formConfigurationModel => {
        expect(formConfigurationModel).toEqual(formModelMock.formConfigurationModel);
        expect(getFormByTransactionId$Spy).toHaveBeenCalledWith(service['_transactionId'].value, undefined, action.modalContext);
        expect(_modalActionsSpy).toHaveBeenCalledWith([action, BaseFooterActions.closeModal]);
        expect(_modalFormConfigurationSpy).toHaveBeenCalledWith(formModelMock.formConfigurationModel);

        done();
      });
    });
  });
});
