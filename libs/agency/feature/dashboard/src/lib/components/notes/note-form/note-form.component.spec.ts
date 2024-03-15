import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { UploadedDocumentModel } from '@dsg/shared/data-access/document-api';
import { NoteModel, NoteModelMock, NoteTypesMock } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { ConfirmationModalReponses, INuverialSelectOption, LoadingTestingModule, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingAdapter } from '@dsg/shared/utils/logging';
import { axe } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { Subject, first, of, throwError } from 'rxjs';
import { TransactionDetailService } from '../../transaction-detail/transaction-detail.service';
import { NoteFormComponent, NoteFormMode } from './note-form.component';

const NOTE_TYPES: INuverialSelectOption[] = [
  {
    disabled: false,
    displayTextValue: 'General Note',
    key: 'General Note',
    selected: false,
  },
  {
    disabled: false,
    displayTextValue: 'Email',
    key: 'Email',
    selected: false,
  },
  {
    disabled: false,
    displayTextValue: 'Phone Call',
    key: 'Phone Call',
    selected: false,
  },
  {
    disabled: false,
    displayTextValue: 'Meeting Notes',
    key: 'Meeting Notes',
    selected: false,
  },
];

const mockDialog = {
  open: jest.fn().mockReturnValue({
    afterClosed: () => of(ConfirmationModalReponses.PrimaryAction),
  }),
};

const mockLoggingService = {
  error: jest.fn(),
  log: jest.fn(),
};

const noteId = 'testId';

describe('NoteFormComponent', () => {
  let component: NoteFormComponent;
  let fixture: ComponentFixture<NoteFormComponent>;
  let transactionDetailService: TransactionDetailService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteFormComponent, NoopAnimationsModule, MatDialogModule, LoadingTestingModule],
      providers: [
        MockProvider(DocumentFormService, {
          getDocumentById$: jest.fn().mockReturnValue(of({ filename: 'test name' })),
        }),
        MockProvider(MatDialog, mockDialog),
        MockProvider(NuverialSnackBarService),
        MockProvider(TransactionDetailService, {
          createNote$: jest.fn().mockReturnValue(of(new NoteModel())),
          deleteNote$: jest.fn().mockReturnValue(of([])),
          editNote$: jest.fn().mockReturnValue(of([])),
          getNoteById$: jest.fn().mockReturnValue(of(new NoteModel())),
          notes: [new NoteModel()],
          transactionId: 'mockTransactionId',
        }),
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest.fn().mockReturnValue(of(NoteTypesMock)),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: new Subject(),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
          },
        },
        {
          provide: LoggingAdapter,
          useValue: mockLoggingService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    transactionDetailService = TestBed.inject(TransactionDetailService);
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return note types', done => {
    component.noteTypesOptions$.subscribe(noteTypes => {
      expect(noteTypes).toStrictEqual(NOTE_TYPES.map(noteType => ({ ...noteType })));
      done();
    });
  });

  describe('Edit Note', () => {
    beforeEach(() => {
      component.mode = NoteFormMode.Edit;

      const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
      paramMapSubject.next(convertToParamMap({ noteId }));
    });

    it('should have headerTitle as Edit note', () => {
      expect(component.headerTitle).toBe('Edit note');
    });

    it('should get note by id when noteId is present in URL', () => {
      const spy = jest.spyOn(transactionDetailService, 'getNoteById$');
      expect(spy).toHaveBeenCalled();
    });

    it('should call the notes getter from transactionDetailService when getting a note by Id', () => {
      Object.defineProperty(transactionDetailService, 'notes', {
        get: jest.fn(() => [new NoteModel()]),
      });
      const notesSpy = jest.spyOn(transactionDetailService, 'notes', 'get');

      component.getNoteById('123');
      expect(notesSpy).toHaveBeenCalled();
    });

    it('should call NuverialSnackBarService on error when getting the note by id', () => {
      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);
      jest.spyOn(transactionDetailService, 'getNoteById$').mockReturnValue(throwError(() => new Error('Note not found')));

      component.note$.subscribe(() => {
        expect(nuverialSnackBarService.notifyApplicationError).toHaveBeenCalled();
      });

      const activatedRoute = TestBed.inject(ActivatedRoute);
      (activatedRoute.paramMap as Subject<any>).next(convertToParamMap({ noteId }));
    });

    it('should call editNote from service when saving the note - edit', () => {
      component.noteFormGroup.setValue({
        body: 'Test body',
        title: 'Test title',
        type: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        attachments: [],
      });
      const spy = jest.spyOn(transactionDetailService, 'editNote$');
      component.saveNote();

      expect(spy).toHaveBeenCalledWith(component.transactionId, noteId, NoteModelMock);
    });

    it('should call openSnackbar with error as param when error throwns when saving the note - edit', fakeAsync(() => {
      component.noteFormGroup.setValue({
        body: 'Test body',
        title: 'Test title',
        type: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        attachments: [],
      });
      jest.spyOn(transactionDetailService, 'editNote$').mockReturnValue(throwError(() => new Error('Note not found')));

      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);
      const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');

      component.saveNote();
      tick();

      expect(spyNotifyApplicationError).toHaveBeenCalled();
    }));
  });

  describe('note$', () => {
    it('should transform attachment id to DocumentEntry', fakeAsync(() => {
      const mockNote = new NoteModel();
      mockNote.documents = ['attachment1', 'attachment2'];
      mockNote.body = 'Note body';
      mockNote.title = 'Note title';
      mockNote.type = { id: 'type-id' };

      const documentFormService = ngMocks.findInstance(DocumentFormService);
      const spy = jest.spyOn(documentFormService, 'getDocumentById$').mockReturnValue(of({ filename: 'Mock filename' } as UploadedDocumentModel));
      jest.spyOn(transactionDetailService, 'getNoteById$').mockReturnValue(of(mockNote));

      const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
      paramMapSubject.next(convertToParamMap({ noteId: '341231' }));

      component.note$.pipe(first()).subscribe(() => {
        expect(spy).toBeCalledTimes(2);

        expect(component.noteFormGroup.value.attachments).toEqual([
          { documentId: 'attachment1', filename: 'Mock filename' },
          { documentId: 'attachment2', filename: 'Mock filename' },
        ]);
        expect(component.noteFormGroup.value.body).toBe('Note body');
        expect(component.noteFormGroup.value.title).toBe('Note title');
        expect(component.noteFormGroup.value.type).toBe('type-id');
      });
    }));

    it('should handle the case when note has no attachments', () => {
      const mockNote = new NoteModel();
      mockNote.documents = [];
      jest.spyOn(transactionDetailService, 'getNoteById$').mockReturnValue(of(mockNote));

      component.note$.subscribe(() => {
        expect(component.noteFormGroup.value.attachments).toEqual([]);
      });
    });
  });

  describe('Add Note', () => {
    beforeEach(() => {
      component.mode = NoteFormMode.Add;

      const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
      paramMapSubject.next(convertToParamMap({ noteId: '' }));
    });

    it('should have headerTitle as Add new note', () => {
      expect(component.headerTitle).toBe('Add new note');
    });

    it('should not call getNoteById when not creating a new note - add', () => {
      const spy = jest.spyOn(transactionDetailService, 'getNoteById$');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call createNote from service when saving the note - add', () => {
      component.noteFormGroup.setValue({
        body: 'Test body',
        title: 'Test title',
        type: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        attachments: [],
      });
      const spy = jest.spyOn(transactionDetailService, 'createNote$');
      component.saveNote();

      expect(spy).toHaveBeenCalledWith(component.transactionId, NoteModelMock);
    });

    it('should call openSnackbar with error as param when error throwns when saving the note - edit', fakeAsync(() => {
      component.noteFormGroup.setValue({
        body: 'Test body',
        title: 'Test title',
        type: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        attachments: [],
      });
      jest.spyOn(transactionDetailService, 'createNote$').mockReturnValue(throwError(() => new Error('')));

      const nuverialSnackBarService = TestBed.inject(NuverialSnackBarService);
      const spyNotifyApplicationError = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');

      component.saveNote();
      tick();

      expect(spyNotifyApplicationError).toHaveBeenCalled();
    }));

    it('should set formErrors and showErrorHeader when form is invalid', () => {
      component.noteFormGroup.setValue({
        body: 'Test body',
        title: '',
        type: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        attachments: [],
      });
      const spy = jest.spyOn(transactionDetailService, 'createNote$');
      component.saveNote();

      expect(component.formErrors.length).toBeGreaterThan(0);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('should call the saveNote method when the "save" action is clicked', () => {
    const spy = jest.spyOn(component, 'saveNote');

    component.onActionClick('save');

    expect(spy).toHaveBeenCalled();
  });

  it('should call the navigateToNotes method when the "cancel" action is clicked', () => {
    const spy = jest.spyOn(component, 'navigateToNotes');

    component.onActionClick('cancel');

    expect(spy).toHaveBeenCalled();
  });

  it('should call the deleteNote method when the "delete" action is clicked', () => {
    const spy = jest.spyOn(component, 'deleteNote').mockImplementation(() => null);

    component.onActionClick('delete');

    expect(spy).toHaveBeenCalled();
  });

  describe('Delete Note', () => {
    beforeEach(() => {
      component.mode = NoteFormMode.Edit;

      const paramMapSubject = TestBed.inject(ActivatedRoute).paramMap as Subject<any>;
      paramMapSubject.next(convertToParamMap({ noteId }));
    });

    it('should delete note if user confirms', () => {
      const dialogService = ngMocks.findInstance(MatDialog);
      const dialogOpenSpy = jest.spyOn(dialogService, 'open').mockReturnValue({
        afterClosed: () => of(ConfirmationModalReponses.PrimaryAction),
      } as any);

      const transactionService = ngMocks.findInstance(TransactionDetailService);
      const deleteNoteSpy = jest.spyOn(transactionService, 'deleteNote$');

      const snackService = ngMocks.findInstance(NuverialSnackBarService);
      const successSpy = jest.spyOn(snackService, 'notifyApplicationSuccess');

      const navigateSpy = jest.spyOn(component, 'navigateToNotes');

      component.deleteNote();

      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(deleteNoteSpy).toHaveBeenCalledWith(transactionService.transactionId, noteId);
      expect(successSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalled();
    });

    it('should not delete note if user confirms', () => {
      const dialogService = ngMocks.findInstance(MatDialog);
      const dialogOpenSpy = jest.spyOn(dialogService, 'open').mockReturnValue({
        afterClosed: () => of(undefined),
      } as any);

      const transactionService = ngMocks.findInstance(TransactionDetailService);
      const deleteNoteSpy = jest.spyOn(transactionService, 'deleteNote$');

      const snackService = ngMocks.findInstance(NuverialSnackBarService);
      const successSpy = jest.spyOn(snackService, 'notifyApplicationSuccess');

      component.deleteNote();

      expect(dialogOpenSpy).toHaveBeenCalled();
      expect(deleteNoteSpy).not.toHaveBeenCalled();
      expect(successSpy).not.toHaveBeenCalled();
    });
  });

  describe('dropHandler', () => {
    it('should upload documents', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      const fileList: FileList = Object.assign([file], {
        item: (index: number) => (index === 0 ? file : null),
      });
      const dataTransfer: DataTransfer = { files: fileList } as DataTransfer;

      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };

      const richTextEditorAttachmentComponentMock = {
        uploadDocuments: jest.fn(() => {
          return;
        }),
      };

      component.richTextEditorAttachmentComponent = richTextEditorAttachmentComponentMock as any;
      const uploadDocumentsSpy = jest.spyOn(component.richTextEditorAttachmentComponent, 'uploadDocuments');
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(uploadDocumentsSpy).toHaveBeenCalledWith([file]);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not add files if dataTransfer.files is undefined', () => {
      const dataTransfer: DataTransfer = {} as DataTransfer;
      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };
      const richTextEditorAttachmentComponentMock = {
        uploadDocuments: jest.fn(() => {
          return;
        }),
      };
      component.richTextEditorAttachmentComponent = richTextEditorAttachmentComponentMock as any;
      const uploadDocumentsSpy = jest.spyOn(component.richTextEditorAttachmentComponent, 'uploadDocuments');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(uploadDocumentsSpy).not.toHaveBeenCalled();
    });

    it('should not add files if dataTransfer is undefined', () => {
      const dataTransfer = undefined;
      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };
      const richTextEditorAttachmentComponentMock = {
        uploadDocuments: jest.fn(() => {
          return;
        }),
      };
      component.richTextEditorAttachmentComponent = richTextEditorAttachmentComponentMock as any;
      const uploadDocumentsSpy = jest.spyOn(component.richTextEditorAttachmentComponent, 'uploadDocuments');

      fixture.componentInstance.dropHandler(event as DragEvent);
      fixture.detectChanges();

      expect(uploadDocumentsSpy).not.toHaveBeenCalled();
    });
  });

  describe('dragOverHandler', () => {
    it('should prevent default and stop propagation', () => {
      const dataTransfer: DataTransfer = {} as DataTransfer;
      const event: Partial<DragEvent> = {
        dataTransfer,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        target: null,
      };

      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fixture.componentInstance.dragOverHandler(event as DragEvent);
      fixture.detectChanges();

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
