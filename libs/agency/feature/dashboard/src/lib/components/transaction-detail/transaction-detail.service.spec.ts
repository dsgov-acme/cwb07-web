import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { AuditEventsSchemaMock, AuditRoutesService } from '@dsg/shared/data-access/audit-api';
import {
  DocumentApiRoutesService,
  IAntivirusScannerResult,
  IIdProofingResult,
  IProcessingResultSchema,
  PROCESSING_RESULT_ID,
  ProcessingResultsMock,
  checkIfDocumentShouldDisplayErrors,
} from '@dsg/shared/data-access/document-api';
import { AgencyUsersMock, UserApiRoutesService, UserMock, UserModel } from '@dsg/shared/data-access/user-api';
import {
  CustomerProvidedDocumentMock,
  CustomerProvidedDocumentMock2,
  CustomerProvidedDocumentMock3,
  DocumentRejectionReasonsMock,
  FormConfigurationModel,
  FormModel,
  FormioConfigurationTestMock,
  ICustomerProvidedDocument,
  ICustomerProvidedDocumentGroup,
  INotesPaginationResponse,
  ITransactionActiveTask,
  NoteMock,
  NoteModel,
  TransactionMock,
  TransactionMockWithDocuments,
  TransactionModel,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { EventsLogService } from '@dsg/shared/feature/events';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import { MessagingService } from '@dsg/shared/feature/messaging';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { PagingResponseModel } from '@dsg/shared/utils/http';
import { cloneDeep } from 'lodash';
import { MockProvider, ngMocks } from 'ng-mocks';
import { BehaviorSubject, catchError, isEmpty, lastValueFrom, of, switchMap, throwError } from 'rxjs';
import { TransactionDetailService } from './transaction-detail.service';

global.structuredClone = jest.fn(obj => cloneDeep(obj));

const userModelMock = new UserModel(UserMock);
const noteModelMock = new NoteModel(NoteMock);

const CustomerProvidedDocumentSameDataPathMock2 = {
  ...CustomerProvidedDocumentMock,
  dataPath: CustomerProvidedDocumentMock.dataPath,
  id: '6d0b34d5-7951-4775-87c5-a198ed3e9f02',
};
const CustomerProvidedDocumentSameDataPathMock3 = {
  ...CustomerProvidedDocumentMock,
  dataPath: CustomerProvidedDocumentMock.dataPath,
  id: '6d0b34d5-7951-4775-87c5-a198ed3e9f03',
};

const mockActiveTask: ITransactionActiveTask = {
  actions: [
    {
      key: 'testKey',
      uiClass: 'Primary',
      uiLabel: 'testLabel',
    },
  ],
  key: 'testKey',
  name: 'testName',
};

describe('TransactionDetailService', () => {
  let service: TransactionDetailService;

  const _transaction = new BehaviorSubject<TransactionModel>(new TransactionModel(TransactionMockWithDocuments));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(HttpClient),
        MockProvider(NuverialSnackBarService),
        MockProvider(DocumentApiRoutesService, {
          getDocumentFileData$: jest.fn().mockImplementation(() => of('123')),
          getProcessingResults$: jest.fn().mockReturnValue(of(ProcessingResultsMock)),
        }),
        MockProvider(UserApiRoutesService, {
          getUserById$: jest.fn().mockImplementation(() => of(userModelMock)),
          getUsers$: jest.fn().mockImplementation(() => of(AgencyUsersMock)),
        }),
        MockProvider(UserStateService, {
          getUserById$: jest.fn().mockImplementation(() => of(userModelMock)),
          getUserDisplayName$: jest.fn().mockImplementation(() => of('')),
        }),
        MockProvider(AuditRoutesService, {
          getEvents$: jest.fn().mockImplementation(() => of(AuditEventsSchemaMock)),
        }),
        MockProvider(WorkApiRoutesService, {
          createNote$: jest.fn().mockReturnValue(of(noteModelMock)),
          deleteNote$: jest.fn().mockReturnValue(of(undefined)),
          getNote$: jest.fn().mockReturnValue(of(noteModelMock)),
          updateNote$: jest.fn().mockReturnValue(of(noteModelMock)),
          updateTransactionById$: jest.fn().mockImplementation(() => of(new TransactionModel(TransactionMock))),
          updateTransactionDocumentsById$: jest.fn().mockImplementation(() => of(CustomerProvidedDocumentMock)),
        }),
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest.fn().mockReturnValue(of(DocumentRejectionReasonsMock)),
        }),
        MockProvider(FormRendererService, {
          formConfiguration: new FormConfigurationModel(FormioConfigurationTestMock),
          formConfiguration$: of(new FormConfigurationModel(FormioConfigurationTestMock)),
          getModalConfiguration$: jest.fn().mockImplementation(() => of([{}, new FormConfigurationModel(FormioConfigurationTestMock)])),
          loadTransactionDetails$: jest.fn().mockImplementation(() => of([{}, new TransactionModel(TransactionMockWithDocuments)])),
          transaction: _transaction.value,
          transaction$: _transaction.asObservable(),
          transactionId: 'testId',
        }),
        MockProvider(MessagingService),
        MockProvider(EventsLogService),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 'transactionId' }),
            snapshot: {
              paramMap: {
                get: () => 'mockValue',
              },
              params: { transactionId: 'mockValue' },
            },
          },
        },
      ],
    });
    service = TestBed.inject(TransactionDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get transaction id', () => {
    expect(service.transactionId).toEqual('testId');
  });

  describe('customerProvidedDocument', () => {
    // not working when run in the suite
    it('should sort multiple file documents into the same bucket if they have the same parent', done => {
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock2]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock3]);
      jest.spyOn(service, 'storeCustomerDocuments$').mockReturnValueOnce(of([]));

      service.customerProvidedDocuments$.subscribe((documents: ICustomerProvidedDocumentGroup[]) => {
        expect(documents.length).toEqual(2);

        expect(documents[0].customerProvidedDocuments.length).toEqual(2);
        expect(documents[0].customerProvidedDocuments[0].id).toEqual(CustomerProvidedDocumentMock3.id);
        expect(documents[0].customerProvidedDocuments[1].id).toEqual(CustomerProvidedDocumentMock.id);
        expect(documents[1].customerProvidedDocuments.length).toEqual(1);
        expect(documents[1].customerProvidedDocuments[0].id).toEqual(CustomerProvidedDocumentMock2.id);
        done();
      });
    });

    it('should sort multiple file documents in the same order as transaction data', done => {
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentSameDataPathMock2]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentSameDataPathMock3]);
      jest.spyOn(service, 'storeCustomerDocuments$').mockReturnValueOnce(of([]));

      service.customerProvidedDocuments$.subscribe((documents: ICustomerProvidedDocumentGroup[]) => {
        expect(documents.length).toEqual(1);

        expect(documents[0].customerProvidedDocuments.length).toEqual(3);
        expect(documents[0].customerProvidedDocuments[0].id).toEqual(CustomerProvidedDocumentMock.id);
        expect(documents[0].customerProvidedDocuments[1].id).toEqual(CustomerProvidedDocumentSameDataPathMock2.id);
        expect(documents[0].customerProvidedDocuments[2].id).toEqual(CustomerProvidedDocumentSameDataPathMock3.id);
        done();
      });
    });

    it('should maintain file order if data path doesnt exist in transaction data', done => {
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentMock]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentSameDataPathMock2]);
      service['_customerProvidedDocuments'].next([...service['_customerProvidedDocuments'].getValue(), CustomerProvidedDocumentSameDataPathMock3]);
      jest.spyOn(service, 'storeCustomerDocuments$').mockReturnValueOnce(of([]));

      service.customerProvidedDocuments$.subscribe((documents: ICustomerProvidedDocumentGroup[]) => {
        expect(documents.length).toEqual(1);

        expect(documents[0].customerProvidedDocuments.length).toEqual(3);
        expect(documents[0].customerProvidedDocuments[0].id).toEqual(CustomerProvidedDocumentMock.id);
        expect(documents[0].customerProvidedDocuments[1].id).toEqual(CustomerProvidedDocumentSameDataPathMock2.id);
        expect(documents[0].customerProvidedDocuments[2].id).toEqual(CustomerProvidedDocumentSameDataPathMock3.id);
        done();
      });
    });

    it('should map the document for rendering', async () => {
      const userStateService = TestBed.inject(UserStateService);

      userStateService.getUserDisplayName$ = jest.fn().mockImplementationOnce(() => of('Chandler Muriel Bing'));

      const mappedDocument = await service['_mapDocumentForRendering'](CustomerProvidedDocumentMock);

      expect(mappedDocument.parentLabel).toEqual('Photo ID');
      expect(mappedDocument.label).toEqual('Back of ID');
      expect(mappedDocument.reviewedByDisplayName).toEqual('Chandler Muriel Bing');
    });

    it('should return sorted customer provided documents', () => {
      const documents: Array<Partial<ICustomerProvidedDocument>> = [
        { parentKey: 'key1', dataPath: 'path1', id: 'd1', shouldDisplayErrors: true, reviewStatus: 'APPROVED' },
        { parentKey: 'key1', dataPath: 'path1', id: 'd2', shouldDisplayErrors: true, reviewStatus: 'APPROVED' },
        { parentKey: 'key2', dataPath: 'path2', id: 'd3', shouldDisplayErrors: false, reviewStatus: 'REJECTED' },
      ];
      const formConfiguration: FormConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);
      const storeCustomerDocumentsSpy = jest.spyOn(service, 'storeCustomerDocuments$').mockReturnValueOnce(of(documents as ICustomerProvidedDocument[]));
      const findComponentsKeyInOrderSpy = jest.spyOn(formConfiguration, 'findComponentsKeyInOrder').mockReturnValueOnce(['key1', 'key2']);

      service.customerProvidedDocuments$.subscribe(result => {
        expect(storeCustomerDocumentsSpy).toHaveBeenCalled();
        expect(findComponentsKeyInOrderSpy).toHaveBeenCalledWith(['key1', 'key2']);

        expect(result).toEqual([
          {
            customerProvidedDocuments: [
              { parentKey: 'key1', dataPath: 'path1', id: 'd1', shouldDisplayErrors: true, reviewStatus: 'APPROVED' },
              { parentKey: 'key1', dataPath: 'path1', id: 'd2', shouldDisplayErrors: true, reviewStatus: 'APPROVED' },
            ],
            hasIssues: true,
            isMultipleFileUpload: true,
          },
          {
            customerProvidedDocuments: [
              { parentKey: 'key2', dataPath: 'path2', id: 'd3', shouldDisplayErrors: false, processingResult: false, reviewStatus: 'REJECTED' },
            ],
            hasIssues: true,
            isMultipleFileUpload: false,
          },
        ]);
      });
    });

    it('should store mapped documents from the transaction to the behavior subject', done => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      const formRendererService = TestBed.inject(FormRendererService);

      service.storeCustomerDocuments$().subscribe(_ => {
        expect(_customerProvidedDocumentsSpy).toHaveBeenCalled();
        expect(_mapDocumentForRenderingSpy).toHaveBeenCalledTimes(formRendererService.transaction.customerProvidedDocuments?.length || -1);
        done();
      });
    });
  });

  describe('initialize$', () => {
    it('should initialize the messaging service', done => {
      const messagingService = ngMocks.findInstance(MessagingService);
      const spy = jest.spyOn(messagingService, 'initialize');
      const testTransactionId = '123';
      service.initialize$(testTransactionId).subscribe(() => {
        expect(spy).toHaveBeenCalledWith('TRANSACTION', testTransactionId);
        done();
      });
    });

    it('should initialize the events-log service', done => {
      const eventsLogService = ngMocks.findInstance(EventsLogService);
      const spy = jest.spyOn(eventsLogService, 'initialize');
      const testTransactionId = '123';
      service.initialize$(testTransactionId).subscribe(() => {
        expect(spy).toHaveBeenCalledWith('transaction', testTransactionId);
        done();
      });
    });

    it('should call loadTransactionDetails$ with transactionId', () => {
      const formRendererService = ngMocks.findInstance(FormRendererService);
      const loadTransactionDetails$Spy = jest.spyOn(formRendererService, 'loadTransactionDetails$');
      service.initialize$('testId').subscribe();
      expect(loadTransactionDetails$Spy).toHaveBeenCalledWith('testId');
    });

    it('should receive processingResults back from a document', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        expect(results).toBeTruthy();
      });
    });

    it('should display an error if antivirus scanning processing result has a code other than 200', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const antivirusResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.antivirus)?.result as IAntivirusScannerResult;
        expect(antivirusResult.shouldDisplayError).toEqual(true);
      });
    });

    it('should set the overall document.shouldDisplayErrors to true if any processingResult has an error', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(_ => {
        expect(CustomerProvidedDocumentMock.shouldDisplayErrors).toEqual(true);
      });
    });

    it('should display an error if document id proofing processing result does not have an allPass', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const idProofingResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.idProofing)?.result as IIdProofingResult;
        expect(idProofingResult.shouldDisplayError).toEqual(true);
      });
    });

    it('should not display any evidence signals in the id proofing processing results', async () => {
      service.getProcessingResults$(CustomerProvidedDocumentMock.id).subscribe(results => {
        const idProofingResult = results.find(x => x.processorId === PROCESSING_RESULT_ID.idProofing)?.result as IIdProofingResult;
        expect(idProofingResult.signals.filter(s => s.name.includes('evidence'))).toEqual(false);
      });
    });

    it('should not call getProcessingResults if no documents', () => {
      const documentApiRoutesService = ngMocks.findInstance(DocumentApiRoutesService);
      const getProcessingResults$Spy = jest.spyOn(documentApiRoutesService, 'getProcessingResults$');
      const formRendererService = ngMocks.findInstance(FormRendererService);
      const loadTransactionDetails$Spy = jest
        .spyOn(formRendererService, 'loadTransactionDetails$')
        .mockImplementation(_ => of([new FormModel(), new TransactionModel(TransactionMock)]));
      service.initialize$('testId').subscribe();
      expect(loadTransactionDetails$Spy).toHaveBeenCalledWith('testId');
      expect(getProcessingResults$Spy).not.toHaveBeenCalled();
    });

    it('should handle error loading processingResults$', async () => {
      const documentApiRoutesService = ngMocks.findInstance(DocumentApiRoutesService);
      jest.spyOn(documentApiRoutesService, 'getProcessingResults$').mockImplementation(() => throwError(() => new Error('an error')));
      service.initialize$('testId').subscribe(results => {
        expect(results).toEqual([]);
      });
    });

    it('should call loadAssignedAgent$ and loadUser$ functions', () => {
      const loadAssignedAgent$Spy = jest.spyOn(service, 'loadAssignedAgent$');
      const loadUser$Spy = jest.spyOn(service, 'loadUser$');
      service.initialize$('testId').subscribe();
      expect(loadAssignedAgent$Spy).toHaveBeenCalledTimes(1);
      expect(loadUser$Spy).toHaveBeenCalledTimes(1);
    });

    it('should call loadAssignedAgent$ and return if no user model', () => {
      const loadAssignedAgent$Spy = jest.spyOn(service, 'loadAssignedAgent$');
      const userStateService = ngMocks.findInstance(UserStateService);
      jest.spyOn(userStateService, 'getUserById$').mockReturnValue(of(undefined));
      service.initialize$('testId').subscribe();
      expect(loadAssignedAgent$Spy).toHaveBeenCalledTimes(1);
      service.loadAssignedAgent$('id').subscribe(agent => {
        expect(agent).toBe(undefined);
      });
    });
  });

  describe('_getUser$', () => {
    it('should get a userModel', done => {
      const userApiService = ngMocks.findInstance(UserApiRoutesService);
      const getUserById$Spy = jest.spyOn(userApiService, 'getUserById$');
      const _userSpy = jest.spyOn(service['_user'], 'next');

      service['_getUserById$']('testId').subscribe(userModel => {
        expect(userModel).toEqual(userModelMock);
        expect(getUserById$Spy).toHaveBeenCalledWith('testId');
        expect(_userSpy).toBeCalledWith(userModelMock);

        done();
      });
    });
  });

  describe('loadUserDetails$', () => {
    it('should load user details', done => {
      service.loadUser$('testId').subscribe();

      service.user$.subscribe(userModel => {
        expect(userModel).toEqual(userModelMock);

        done();
      });
    });
  });

  describe('getDocumentRejectionReasons', () => {
    it('should get the document rejection reasons', done => {
      service.getDocumentRejectionReasons$().subscribe(reasons => {
        expect(4).toEqual(reasons.size);
        expect('Incorrect Type').toEqual(reasons.get('INCORRECT_TYPE')?.label);
        done();
      });
    });
  });

  describe('getProcessingResults', () => {
    it('should get the document processing results', done => {
      const documentService = ngMocks.findInstance(DocumentApiRoutesService);
      documentService.getProcessingResults$('6d0b34d5-7951-4775-87c5-a198ed3e9f01').subscribe(reasons => {
        expect(reasons.length).toEqual(ProcessingResultsMock.length);
        done();
      });
    });
  });

  describe('updateCustomerProvidedDocument', () => {
    it('should load document with mapped processing results', done => {
      const processingResults = JSON.parse(JSON.stringify(ProcessingResultsMock as IProcessingResultSchema[]));
      const shouldDisplayErrors = checkIfDocumentShouldDisplayErrors(processingResults) > 0;
      service['_processingResults'].set(CustomerProvidedDocumentMock.id, JSON.parse(JSON.stringify(ProcessingResultsMock as IProcessingResultSchema[])));
      service
        .updateCustomerProvidedDocument(CustomerProvidedDocumentMock.id, {
          ...CustomerProvidedDocumentMock,
          rejectionReasons: undefined,
          reviewStatus: 'ACCEPTED',
        })
        .subscribe(document => {
          expect(document.reviewStatus).toEqual('ACCEPTED');
          expect(document.processingResult).toEqual(processingResults);
          expect(document.shouldDisplayErrors).toEqual(shouldDisplayErrors);
          done();
        });
    });

    it('should maintain processing results after updates', done => {
      const processingResults = JSON.parse(JSON.stringify(ProcessingResultsMock as IProcessingResultSchema[]));
      const shouldDisplayErrors = checkIfDocumentShouldDisplayErrors(processingResults) > 0;
      service['_processingResults'].set(CustomerProvidedDocumentMock.id, JSON.parse(JSON.stringify(ProcessingResultsMock as IProcessingResultSchema[])));
      service
        .updateCustomerProvidedDocument(CustomerProvidedDocumentMock.id, {
          ...CustomerProvidedDocumentMock,
          rejectionReasons: undefined,
          reviewStatus: 'ACCEPTED',
        })
        .pipe(
          switchMap(document => {
            expect(document.processingResult).toEqual(processingResults);
            expect(document.shouldDisplayErrors).toEqual(shouldDisplayErrors);

            return service.updateCustomerProvidedDocument(CustomerProvidedDocumentMock.id, {
              ...document,
              rejectionReasons: undefined,
              reviewStatus: 'NEW',
            });
          }),
        )
        .subscribe(document => {
          expect(document.processingResult).toEqual(processingResults);
          expect(document.shouldDisplayErrors).toEqual(shouldDisplayErrors);
          done();
        });
    });

    it('should load document', done => {
      const spy = jest.spyOn(service, 'getProcessingResults$').mockImplementation(() => of(ProcessingResultsMock as IProcessingResultSchema[]));
      service
        .updateCustomerProvidedDocument(CustomerProvidedDocumentMock.id, {
          ...CustomerProvidedDocumentMock,
          rejectionReasons: undefined,
          reviewStatus: 'ACCEPTED',
        })
        .subscribe(document => {
          expect(document.reviewStatus).toEqual('ACCEPTED');
          expect(spy).toHaveBeenCalled();
          expect(document.processingResult).toEqual(ProcessingResultsMock);
          done();
        });
    });
  });

  describe('storeCustomerDocuments$', () => {
    it('should store mapped documents from the transaction to the behavior subject', done => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      const formRendererService = TestBed.inject(FormRendererService);

      service.storeCustomerDocuments$().subscribe(_ => {
        expect(_customerProvidedDocumentsSpy).toHaveBeenCalled();
        expect(_mapDocumentForRenderingSpy).toHaveBeenCalledTimes(formRendererService.transaction.customerProvidedDocuments?.length || -1);
        done();
      });
    });

    it('should return EMPTY if transaction is not defined', () => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      const formRendererService = TestBed.inject(FormRendererService);
      Object.defineProperty(formRendererService, 'transaction', {
        get: () => new TransactionModel(),
      });

      service.storeCustomerDocuments$().subscribe();
      expect(_customerProvidedDocumentsSpy).not.toHaveBeenCalled();
      expect(_mapDocumentForRenderingSpy).not.toHaveBeenCalled();
    });

    it('should return _customerProvidedDocuments if it exists', () => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      const _mapDocumentForRenderingSpy = jest.spyOn(service as any, '_mapDocumentForRendering');
      TestBed.inject(FormRendererService);
      service['_customerProvidedDocuments'].next([CustomerProvidedDocumentMock]);

      service.storeCustomerDocuments$().subscribe(documents => {
        expect(documents).toEqual([CustomerProvidedDocumentMock]);
        expect(_customerProvidedDocumentsSpy).not.toHaveBeenCalled();
        expect(_mapDocumentForRenderingSpy).not.toHaveBeenCalled();
      });
    });

    it('should return an empty observable if there are no customer provided documents', async () => {
      // Arrange
      const transactionModel = new TransactionModel();
      transactionModel.customerProvidedDocuments = [];

      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });

      // Act
      const result$ = await lastValueFrom(service.storeCustomerDocuments$().pipe(isEmpty()));

      // Assert
      expect(result$).toBeTruthy();
    });

    it('should return an empty observable if transactionModel or customerProvidedDocuments is not defined', async () => {
      // Arrange
      const transactionModel = undefined;
      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });

      // Act
      const result$ = await lastValueFrom(service.storeCustomerDocuments$().pipe(isEmpty()));

      // Assert
      expect(result$).toBeTruthy();
    });

    it('should set processing results and shouldDisplayErrors for each customer provided document', async () => {
      // Arrange
      const document1: Partial<ICustomerProvidedDocument> = { id: '1', processingResult: [], shouldDisplayErrors: false, active: false };
      const document2: Partial<ICustomerProvidedDocument> = { id: '2', processingResult: [], shouldDisplayErrors: false, active: false };
      const transactionModel = new TransactionModel();
      transactionModel.customerProvidedDocuments = [document1 as ICustomerProvidedDocument, document2 as ICustomerProvidedDocument];
      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });
      jest
        .spyOn(service, 'getProcessingResults$')
        .mockReturnValueOnce(of([]))
        .mockReturnValueOnce(of(ProcessingResultsMock as IProcessingResultSchema[]));
      jest
        .spyOn(service as any, '_mapDocumentForRendering')
        .mockResolvedValueOnce(document1 as ICustomerProvidedDocument)
        .mockResolvedValueOnce(document2 as ICustomerProvidedDocument);

      // Act
      const result$ = await lastValueFrom(service.storeCustomerDocuments$());

      // Assert
      expect(result$).toEqual([document1, document2]);
      expect(document1.processingResult).toEqual([]);
      expect(document1.shouldDisplayErrors).toBeFalsy();
      expect(document2.processingResult).toEqual(ProcessingResultsMock);
      expect(document2.shouldDisplayErrors).toBeTruthy();
    });

    it('should handle error when getting processing results', done => {
      // Arrange
      const document: Partial<ICustomerProvidedDocument> = { id: '1', processingResult: [], shouldDisplayErrors: false, active: false };
      const transactionModel = new TransactionModel();
      transactionModel.customerProvidedDocuments = [document as ICustomerProvidedDocument];
      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });
      jest.spyOn(service, 'getProcessingResults$').mockReturnValue(throwError(() => new Error('an error')));

      // Act
      service
        .storeCustomerDocuments$()
        .pipe(
          catchError(error => {
            expect(error).toBeTruthy();
            expect(document.processingResult).toEqual([]);
            expect(document.shouldDisplayErrors).toBeFalsy();
            done();

            return of(error);
          }),
        )
        .subscribe();
    });

    it('should map and emit the customer provided documents', async () => {
      // Arrange
      const document1: Partial<ICustomerProvidedDocument> = { id: '1', processingResult: [], shouldDisplayErrors: false, active: false };
      const document2: Partial<ICustomerProvidedDocument> = { id: '2', processingResult: [], shouldDisplayErrors: false, active: false };
      const transactionModel = new TransactionModel();
      transactionModel.customerProvidedDocuments = [document1 as ICustomerProvidedDocument, document2 as ICustomerProvidedDocument];
      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });
      jest
        .spyOn(service, 'getProcessingResults$')
        .mockReturnValueOnce(of([]))
        .mockReturnValueOnce(of(ProcessingResultsMock as IProcessingResultSchema[]));
      jest
        .spyOn(service as any, '_mapDocumentForRendering')
        .mockResolvedValueOnce(document1 as ICustomerProvidedDocument)
        .mockResolvedValueOnce(document2 as ICustomerProvidedDocument);
      jest.spyOn(service['_customerProvidedDocuments'], 'next');

      const expectedDocuments = [document1, document2];

      // Act
      const result$ = await lastValueFrom(service.storeCustomerDocuments$());

      // Assert
      expect(result$).toEqual(expectedDocuments);
      expect(service['_customerProvidedDocuments'].next).toHaveBeenCalledWith(expectedDocuments);
    });

    it('should call getProcessingResults$ for documents with pending processing results', async () => {
      // Arrange
      const document1 = { id: 'document1', processingResult: [], shouldDisplayErrors: false };
      const document2 = { id: 'document2', processingResult: [], shouldDisplayErrors: false };
      const transactionModel = { customerProvidedDocuments: [document1, document2] };
      jest.spyOn(service, 'getProcessingResults$').mockReturnValueOnce(of([{ status: 'PENDING' }] as IProcessingResultSchema[]));
      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });
      jest
        .spyOn(service as any, '_mapDocumentForRendering')
        .mockResolvedValueOnce(document1 as unknown as ICustomerProvidedDocument)
        .mockResolvedValueOnce(document2 as unknown as ICustomerProvidedDocument);

      // Act
      const result$ = await lastValueFrom(service.storeCustomerDocuments$());

      // Assert
      expect(result$).toEqual([document1, document2]);
      expect(service.getProcessingResults$).toHaveBeenCalledTimes(2);
      expect(service.getProcessingResults$).toHaveBeenCalledWith('document1');
      expect(service.getProcessingResults$).toHaveBeenCalledWith('document2');
    });

    it('should set processingResult and shouldDisplayErrors properties for documents', async () => {
      // Arrange
      const document1 = { id: 'document1', processingResult: [], shouldDisplayErrors: false };
      const document2 = { id: 'document2', processingResult: [], shouldDisplayErrors: false };
      const transactionModel = { customerProvidedDocuments: [document1, document2] };
      jest.spyOn(service['_processingResults'], 'get').mockReturnValueOnce([{ status: 'PENDING' }, { status: 'COMPLETE' }] as IProcessingResultSchema[]);
      jest.spyOn(service, 'getProcessingResults$').mockReturnValueOnce(of(ProcessingResultsMock as IProcessingResultSchema[]));
      Object.defineProperty(service['_formRendererService'], 'transaction', {
        get: jest.fn(() => transactionModel),
      });
      jest
        .spyOn(service as any, '_mapDocumentForRendering')
        .mockResolvedValueOnce(document1 as unknown as ICustomerProvidedDocument)
        .mockResolvedValueOnce(document2 as unknown as ICustomerProvidedDocument);

      // Act
      const result$ = await lastValueFrom(service.storeCustomerDocuments$());

      // Assert
      expect(result$).toEqual([document1, document2]);
      expect(document1.processingResult).toEqual([{ status: 'PENDING' }, { status: 'COMPLETE' }]);
      expect(document1.shouldDisplayErrors).toBe(false);
      expect(document2.shouldDisplayErrors).toBe(true);
      expect(service.getProcessingResults$).toHaveBeenCalledTimes(1);
      expect(service.getProcessingResults$).toHaveBeenCalledWith('document2');
    });
  });

  it('should call createNote from workApiRoutesService when creating a new note', () => {
    const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
    const spy = jest.spyOn(workApiRoutesService, 'createNote$').mockReturnValue(of());

    service.createNote$('123', noteModelMock);
    expect(spy).toHaveBeenCalledWith('123', noteModelMock);
  });

  it('should should return a result when processing requests is an empty array', done => {
    const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
    const getProcessingResults$Spy = jest.spyOn(service, 'getProcessingResults$');
    jest.spyOn(service['_processingResults'], 'get').mockReturnValue(ProcessingResultsMock as IProcessingResultSchema[]);

    service.storeCustomerDocuments$().subscribe(documents => {
      expect(_customerProvidedDocumentsSpy).toHaveBeenCalled();
      expect(getProcessingResults$Spy).not.toHaveBeenCalled();
      expect(documents).toBeTruthy();
      done();
    });
  });

  describe('getProcessingResults', () => {
    it('should call getProcessingResults from _documentApiRoutesService when getProcessingResults is called', () => {
      const documentApiRoutesService = TestBed.inject(DocumentApiRoutesService);
      const spy = jest.spyOn(documentApiRoutesService, 'getProcessingResults$').mockReturnValue(of());

      service.getProcessingResults$('123');
      expect(spy).toHaveBeenCalledWith('123');
    });

    it('should return failed antivirus processing result if it gets a 410 error', done => {
      const documentApiRoutesService = TestBed.inject(DocumentApiRoutesService);
      jest.spyOn(documentApiRoutesService, 'getProcessingResults$').mockReturnValue(
        throwError(() => ({
          status: 410,
        })),
      );

      service.getProcessingResults$('123').subscribe(results => {
        expect(results).toEqual([
          {
            processorId: 'antivirus-scanner',
            result: {
              code: '',
              message: 'Malware detected. Document has been quarantined',
              shouldDisplayError: true,
              status: 410,
            },
            status: 'COMPLETE',
            timestamp: '',
          } as IProcessingResultSchema,
        ]);

        done();
      });
    });

    it('should return empty array if it gets an unknown error', done => {
      const documentApiRoutesService = TestBed.inject(DocumentApiRoutesService);
      jest.spyOn(documentApiRoutesService, 'getProcessingResults$').mockReturnValue(
        throwError(() => ({
          status: 999,
        })),
      );

      service.getProcessingResults$('123').subscribe(results => {
        expect(results).toEqual([]);

        done();
      });
    });
  });

  describe('loadNotes$', () => {
    it('should load notes and update the internal subjects', done => {
      const notesResponse: INotesPaginationResponse<NoteModel> = {
        items: [noteModelMock],
        pagingMetadata: new PagingResponseModel(),
      };
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      jest.spyOn(workApiRoutesService, 'getNotes$').mockReturnValue(of(notesResponse));
      const _notesSpy = jest.spyOn(service['_notes'], 'next');
      const _notesPaginationSpy = jest.spyOn(service['_notesPagination'], 'next');

      service.loadNotes$('testTransactionId').subscribe(() => {
        expect(_notesSpy).toHaveBeenCalledWith(notesResponse.items);
        expect(_notesPaginationSpy).toHaveBeenCalledWith(notesResponse.pagingMetadata);
        expect(service.notesPagination).toEqual(service['_notesPagination'].value);
        done();
      });
    });
  });

  it('should cleanup service state', () => {
    jest.spyOn(service['_user'], 'next');

    service.cleanUp();

    expect(service['_user'].next).toHaveBeenCalledWith(new UserModel());
  });

  describe('deleteNotes$', () => {
    it('shoud call deleteNote$ from workApiRoutesService on success', done => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);

      service.deleteNote$(TransactionMock.id, '123').subscribe(_ => {
        expect(workApiRoutesService.deleteNote$).toHaveBeenCalled;
        done();
      });
    });

    it('should call NuverialSnackBarService on error', () => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);

      jest.spyOn(workApiRoutesService, 'deleteNote$').mockImplementation(() => throwError(() => new Error('an error')));
      const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');
      service.deleteNote$(TransactionMock.id, '123').subscribe();
      expect(spyNotifyApplicationError).toHaveBeenCalled();
    });
  });

  describe('updateTransactionPriority', () => {
    it('should update the transaction', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'updateTransactionById$');

      const transactionModelMock = new TransactionModel(TransactionMock);

      service.updateTransactionPriority$('high').subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith({
          transaction: transactionModelMock.toPrioritySchema(),
          transactionId: 'testId',
        });

        done();
      });
    });
  });

  it('should load the user response from _getUserById to the _user replay subject', done => {
    const userApiService = ngMocks.findInstance(UserApiRoutesService);
    const getUserById$Spy = jest.spyOn(userApiService, 'getUserById$');
    const _userSpy = jest.spyOn(service['_user'], 'next');

    service['_getUserById$']('testId').subscribe(userModel => {
      expect(userModel).toEqual(userModelMock);
      expect(getUserById$Spy).toHaveBeenCalledWith('testId');
      expect(_userSpy).toBeCalledWith(userModelMock);

      done();
    });
  });

  it('should load the assigned agent to _agents subject when loadAssignedAgent$ is called and the assigned agent was not present in _agents', done => {
    const userId = 'testUserId';
    const userStateService = ngMocks.findInstance(UserStateService);

    const getUserById$Spy = jest.spyOn(userStateService, 'getUserById$');
    const _agentsNextSpy = jest.spyOn(service['_agents'], 'next');

    service.loadAssignedAgent$(userId).subscribe(() => {
      expect(getUserById$Spy).toHaveBeenCalledWith(userId);
      expect(_agentsNextSpy).toHaveBeenCalledWith([userModelMock]);
      done();
    });
  });

  it('should load agency users to _agents when loadAgencyUsers$ is called', done => {
    const userApiService = ngMocks.findInstance(UserApiRoutesService);
    const getUsers$Spy = jest.spyOn(userApiService, 'getUsers$');

    const _agentsPaginationNextSpy = jest.spyOn(service['_agentsPagination'], 'next');
    const _agentsNextSpy = jest.spyOn(service['_agents'], 'next');

    service.loadAgencyUsers$().subscribe(() => {
      expect(getUsers$Spy).toHaveBeenCalledWith([{ field: 'userType', value: 'agency' }], undefined);
      expect(_agentsPaginationNextSpy).toHaveBeenCalled();
      expect(_agentsNextSpy).toHaveBeenCalledWith(AgencyUsersMock.users.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      done();
    });
  });

  describe('updateTransactionAssignedTo', () => {
    it('should update the transaction', done => {
      const workApiService = ngMocks.findInstance(WorkApiRoutesService);
      const getTransactionById$Spy = jest.spyOn(workApiService, 'updateTransactionById$');
      const transactionModelMock = new TransactionModel(TransactionMock);

      service.updateTransactionAssignedTo$('agent').subscribe(transactionModel => {
        expect(transactionModel).toEqual(transactionModelMock);
        expect(getTransactionById$Spy).toHaveBeenCalledWith({
          transaction: transactionModelMock.toAssignedToSchema(),
          transactionId: 'testId',
        });

        done();
      });
    });
  });

  describe('review transaction', () => {
    it('should call updateTransactionById$ with the correct parameters and update transaction in formRendererService', () => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const formRendererService = TestBed.inject(FormRendererService);

      jest.spyOn(workApiRoutesService, 'updateTransactionById$').mockReturnValue(of(new TransactionModel()));

      Object.defineProperty(formRendererService, 'transaction', {
        get: () => _transaction.value,
        set: value => {
          formRendererService.transaction = value;
        },
      });

      const spyTransactionSetter = jest.spyOn(formRendererService, 'transaction', 'set');

      service.reviewTransaction$('testAction', 'testTaskId').subscribe();
      expect(workApiRoutesService.updateTransactionById$).toHaveBeenCalledWith({
        completeTask: true,
        taskId: 'testTaskId',
        transaction: new TransactionModel().toActionSchema('testAction'),
        transactionId: 'testId',
      });
      expect(spyTransactionSetter).toHaveBeenCalled();
    });

    it('should call updateTransactionById$ with action.modalContext defined', () => {
      const formRendererService = TestBed.inject(FormRendererService);
      const getModalConfiguration$Spy = jest.spyOn(formRendererService, 'getModalConfiguration$');

      Object.defineProperty(formRendererService, 'transaction', {
        get: () => _transaction.value,
        set: value => {
          formRendererService.transaction = value;
        },
      });

      service.reviewTransaction$('Deny', 'testTaskId').subscribe();

      expect(getModalConfiguration$Spy).toHaveBeenCalledWith({
        key: 'Deny',
        modalButtonLabel: 'None shall pass',
        modalContext: 'openModal',
        uiClass: 'Primary',
        uiLabel: 'None shall pass',
      });
    });

    it('should call updateTransactionById$ with action.modalContext undefined', () => {
      const formRendererService = TestBed.inject(FormRendererService);
      const getModalConfiguration$Spy = jest.spyOn(formRendererService, 'getModalConfiguration$');

      Object.defineProperty(formRendererService, 'transaction', {
        get: () => _transaction.value,
        set: value => {
          formRendererService.transaction = value;
        },
      });

      service.reviewTransaction$('actionDoesNotExist', 'testTaskId').subscribe();

      expect(getModalConfiguration$Spy).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear events', () => {
      const _eventsSpy = jest.spyOn(service['_events'], 'next');
      service.clearEvents();
      expect(_eventsSpy).toBeCalledWith([]);
    });

    it('should clear notes', () => {
      const _notesSpy = jest.spyOn(service['_notes'], 'next');
      service.clearNotes();
      expect(_notesSpy).toBeCalledWith([]);
    });

    it('should clear customer provided documents', () => {
      const _customerProvidedDocumentsSpy = jest.spyOn(service['_customerProvidedDocuments'], 'next');
      service.clearCustomerProvidedDocuments();
      expect(_customerProvidedDocumentsSpy).toBeCalledWith([]);
    });
  });

  describe('notes', () => {
    it('should get notes', () => {
      const note = [new NoteModel(NoteMock)];
      service['_notes'].next(note);
      expect(service.notes).toEqual(note);
    });
    it('should call get note by id', () => {
      const workApiRoutesService = ngMocks.findInstance(WorkApiRoutesService);
      const getNote$Spy = jest.spyOn(workApiRoutesService, 'getNote$');
      service.getNoteById$('123', '456').subscribe();
      expect(getNote$Spy).toBeCalledWith('123', '456');
    });

    it('should edit note', () => {
      const workApiRoutesService = ngMocks.findInstance(WorkApiRoutesService);
      const updateNote$Spy = jest.spyOn(workApiRoutesService, 'updateNote$');
      service.editNote$('123', '456', new NoteModel()).subscribe();
      expect(updateNote$Spy).toBeCalledWith('123', '456', new NoteModel());
    });
  });

  describe('eventsPagination', () => {
    it('should return the value of _eventsPagination', () => {
      const expectedValue: PagingResponseModel = new PagingResponseModel();
      service['_eventsPagination'].next(expectedValue);
      expect(service.eventsPagination).toEqual(expectedValue);
    });
  });

  describe('setFooterActionsEnabled', () => {
    it('should set the footer actions enabled flag', () => {
      const enabled = true;
      service.setFooterActionsEnabled(enabled);
      expect(service['_footerActionsEnabled'].value).toEqual(enabled);
    });
  });

  describe('transactionActiveTask', () => {
    it('should return the first value if activeTasks length is greater than 0', done => {
      const mockTransaction = new TransactionModel({ ...TransactionMockWithDocuments, activeTasks: [mockActiveTask] });
      _transaction.next(mockTransaction);

      service.transactionActiveTask$.subscribe(activeTask => {
        expect(activeTask).toEqual(mockActiveTask);
        done();
      });
    });

    it('should return the undefined if activeTasks length is 0', done => {
      const mockTransaction = new TransactionModel({ ...TransactionMockWithDocuments, activeTasks: [] });
      _transaction.next(mockTransaction);

      service.transactionActiveTask$.subscribe(activeTask => {
        expect(activeTask).toEqual(undefined);
        done();
      });
    });
  });
});
