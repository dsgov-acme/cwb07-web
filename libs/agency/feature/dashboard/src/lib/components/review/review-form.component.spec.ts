/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  DocumentRejectionReasonsMock,
  FormConfigurationModel,
  FormioConfigurationTestMock,
  TransactionMockWithDocuments,
  TransactionModel,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { FormRendererService, FormStateMode } from '@dsg/shared/feature/form-nuv';
import { NuverialSnackBarService, UnsavedChangesService } from '@dsg/shared/ui/nuverial';
import { AccessControlService } from '@dsg/shared/utils/access-control';
import { LoggingService } from '@dsg/shared/utils/logging';
import { createMock } from '@testing-library/angular/jest-utils';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';
import { ReviewFormComponent } from './review-form.component';

const formConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;
  let savingSubject: Subject<boolean>;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  beforeEach(async () => {
    savingSubject = new Subject<boolean>();
    savingSubject.next(false);

    const accessControlService = createMock(AccessControlService);
    accessControlService.isAuthorized.mockReturnValue(true);

    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent, NoopAnimationsModule],
      providers: [
        MockProvider(NuverialSnackBarService),
        MockProvider(LoggingService),
        MockProvider(DocumentFormService),
        MockProvider(TransactionDetailService, {
          customerProvidedDocuments$: of([
            { customerProvidedDocuments: TransactionMockWithDocuments.customerProvidedDocuments ?? [], hasIssues: false, isMultipleFileUpload: false },
          ]),
          setFooterActionsEnabled: jest.fn(),
        }),
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest.fn().mockImplementation(() => of(DocumentRejectionReasonsMock)),
        }),
        MockProvider(FormRendererService, {
          completeEdit$: of(),
          formConfiguration: formConfigurationModel,
          formConfiguration$: of(formConfigurationModel),
          modalFormConfiguration$: of(),
          loadTransactionDetails$: jest.fn().mockImplementation(() => of([])),
          resetFormErrors: jest.fn(),
          transaction: new TransactionModel(TransactionMockWithDocuments),
          transaction$: of(new TransactionModel(TransactionMockWithDocuments)),
        }),
        MockProvider(UserStateService, {
          getUserById$: jest.fn().mockImplementation(() => of({ displayName: 'Mocked Name' })),
        }),
        { provide: AccessControlService, useValue: accessControlService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ transactionId: 'testId' })),
            params: of({ transactionId: 'transactionId' }),
            snapshot: {
              paramMap: {
                get: () => TransactionMockWithDocuments.id,
              },
              params: { transactionId: TransactionMockWithDocuments.id },
              queryParams: {},
            },
          },
        },
        MockProvider(UnsavedChangesService, {
          saveAndContinue$: of(),
          saving$: savingSubject.asObservable(),
          openConfirmationModal$: jest.fn().mockImplementation(() => of(false)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formRendererConfiguration$', () => {
    it('should load form configuration', done => {
      component.formRendererConfiguration$?.subscribe(formConfiguration => {
        expect(formConfiguration).toEqual(formConfigurationModel.toReviewForm());

        done();
      });
    });
  });

  describe('toggleEditMode', () => {
    const DetailsIcon = { ariaLabel: 'Edit', iconName: 'edit' };

    it('should switch to review mode if currently in edit mode', () => {
      // Arrange
      const resetFormState = true;
      const detailsTab = { key: 'details', label: 'Claimant Information' };

      component.tabs = [detailsTab];
      component.rendererOptions.formState.mode = FormStateMode.Edit;

      // Act
      component.toggleEditMode(resetFormState);

      // Assert
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Review);
      expect(component.tabs[0].suffixIcon).toEqual(DetailsIcon);
    });

    it('should switch to edit mode if currently in review mode', () => {
      // Arrange
      const detailsTab = { key: 'details', label: 'Claimant Information', suffixIcon: DetailsIcon };

      component.tabs = [detailsTab];
      component.rendererOptions.formState.mode = FormStateMode.Review;

      // Act
      component.toggleEditMode();

      // Assert
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Edit);
    });

    it('should not switch mode if details tab is not found', () => {
      // Arrange
      component.tabs = [];
      component.rendererOptions.formState.mode = FormStateMode.Edit;

      // Act
      component.toggleEditMode();

      // Assert
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Edit);
    });
  });

  describe('handleActiveTabChange', () => {
    const DetailsIcon = { ariaLabel: 'Edit', iconName: 'edit' };

    it('should set suffixIcon to DetailsIcon when the active tab is "details"', () => {
      // Arrange
      const event = { index: 0, tab: { label: 'Claimant Information', key: 'details' } };

      // Act
      component.handleActiveTabChange(event);

      // Assert
      expect(component.tabs[0].suffixIcon).toEqual(DetailsIcon);
    });

    it('should switch to review mode and remove suffixIcon when the active tab is not "details"', () => {
      // Arrange
      const event = { index: 0, tab: { key: 'other', label: 'Other' } };
      const detailsTab = { key: 'details', label: 'Claimant Information', suffixIcon: DetailsIcon };
      component.tabs = [detailsTab];

      // Act
      component.handleActiveTabChange(event);

      // Assert
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Review);
      expect(detailsTab.suffixIcon).toBeUndefined();
    });

    it('should do nothing if the details tab is not found', () => {
      // Arrange
      const event = { index: 0, tab: { key: 'details', label: 'Details' } };
      component.tabs = [];

      // Act
      component.handleActiveTabChange(event);

      // Assert
      expect(component.tabs.length).toEqual(0);
    });
  });

  describe('_toReviewMode', () => {
    it('should reset the form state', () => {
      jest.spyOn(component.rendererOptions, 'resetModel').mockImplementation(() => jest.fn());

      // Act
      component['_toReviewMode']();

      // Assert
      expect(component['_transactionDetailService'].setFooterActionsEnabled).toHaveBeenCalledWith(true);
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Review);
      expect(component.rendererOptions.resetModel).toHaveBeenCalled();
      expect(component['_formRendererService'].resetFormErrors).toHaveBeenCalled();
    });

    it('should not reset the form state', () => {
      jest.spyOn(component.rendererOptions, 'resetModel').mockImplementation(() => jest.fn());

      // Act
      component['_toReviewMode'](false);

      // Assert
      expect(component['_transactionDetailService'].setFooterActionsEnabled).toHaveBeenCalledWith(true);
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Review);
      expect(component.rendererOptions.resetModel).not.toHaveBeenCalled();
      expect(component['_formRendererService'].resetFormErrors).not.toHaveBeenCalled();
    });
  });

  describe('_toEditMode', () => {
    it('should set form state to Edit mode and remove suffixIcon', () => {
      // Arrange
      const detailsTab = { key: 'details', label: 'Details', suffixIcon: { ariaLabel: 'Edit', iconName: 'edit' } };
      component.tabs = [detailsTab];

      // Act
      component['_toEditMode']();

      // Assert
      expect(component['_transactionDetailService'].setFooterActionsEnabled).toHaveBeenCalledWith(false);
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Edit);
      expect(detailsTab.suffixIcon).toBeUndefined();
    });

    it('should not remove suffixIcon if details tab is not found', () => {
      // Arrange
      component.tabs = [];

      // Act
      component['_toEditMode']();

      // Assert
      expect(component['_transactionDetailService'].setFooterActionsEnabled).toHaveBeenCalledWith(false);
      expect(component.rendererOptions.formState.mode).toEqual(FormStateMode.Edit);
    });
  });

  describe('openConfirmationDialog', () => {
    it('should open confirmation modal if hasUnsavedChanges is true', () => {
      // Arrange
      const event = { index: 0, tab: { key: 'other', label: 'Other' } };

      const service = ngMocks.findInstance(UnsavedChangesService);
      jest.spyOn(service, 'hasUnsavedChanges', 'get').mockReturnValue(true);
      const spy = jest.spyOn(service, 'openConfirmationModal$');

      // Act
      component.openConfirmationDialog(event.index, { focusIndex: 1 } as MatTabHeader);

      // Assert
      expect(spy).toHaveBeenCalled();
    });

    it('should not open confirmation modal if hasUnsavedChanges is false', () => {
      // Arrange
      const event = { index: 0, tab: { key: 'other', label: 'Other' } };

      const service = ngMocks.findInstance(UnsavedChangesService);
      jest.spyOn(service, 'hasUnsavedChanges', 'get').mockReturnValue(false);
      const spy = jest.spyOn(service, 'openConfirmationModal$');

      // Act
      component.openConfirmationDialog(event.index, { focusIndex: 1 } as MatTabHeader);

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not open confirmation modal if showConfirmation is false', () => {
      // Arrange
      const event = { index: 0, tab: { key: 'other', label: 'Other' } };

      const service = ngMocks.findInstance(UnsavedChangesService);
      jest.spyOn(service, 'hasUnsavedChanges', 'get').mockReturnValue(false);
      const spy = jest.spyOn(service, 'openConfirmationModal$');

      // Act
      component.openConfirmationDialog(event.index, { focusIndex: 1 } as MatTabHeader);

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it('should should call saveandcontinue if user confirms to save', () => {
      // Arrange
      const event = { index: 0, tab: { key: 'other', label: 'Other' } };

      const service = ngMocks.findInstance(UnsavedChangesService);
      jest.spyOn(service, 'hasUnsavedChanges', 'get').mockReturnValue(true);
      jest.spyOn(service, 'openConfirmationModal$').mockImplementation((proceed, save) => {
        save();

        return of(false);
      });
      const spy = jest.spyOn(service, 'saveAndContinue');

      // Act
      component.openConfirmationDialog(event.index, { focusIndex: 1 } as MatTabHeader);

      // Assert
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should override _handleClick and call openConfirmationDialog if showConfirmation is true and selectedIndex is different', () => {
      // Arrange
      const tabgroup: Partial<MatTabGroup> = {
        _handleClick: jest.fn(),
        selectedIndex: 1,
      };
      component.nuverialTabs.tabgroup = tabgroup as MatTabGroup;

      const index = 2;
      const tabHeader = {} as MatTabHeader;
      const spy = jest.spyOn(component, 'openConfirmationDialog');

      // Act
      component.ngAfterViewInit();
      component.nuverialTabs.tabgroup._handleClick({} as MatTab, tabHeader, index);

      // Assert
      expect(spy).toHaveBeenCalledWith(index, tabHeader);
    });

    it('should not call openConfirmationDialog if showConfirmation is true and selectedIndex is the same', () => {
      // Arrange
      const tabgroup: Partial<MatTabGroup> = {
        _handleClick: jest.fn(),
        selectedIndex: 1,
      };
      component.nuverialTabs.tabgroup = tabgroup as MatTabGroup;

      const index = 1;
      const tabHeader = {} as MatTabHeader;
      const spy = jest.spyOn(component, 'openConfirmationDialog');

      // Act
      component.ngAfterViewInit();
      component.nuverialTabs.tabgroup._handleClick({} as MatTab, tabHeader, index);

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('handleKeydown', () => {
    it('should override _handleKeydown in setTimeout and call openConfirmationDialog when Enter or Space key is pressed and focusIndex is different from selectedIndex', () => {
      // Arrange
      const tabHeader = {
        _handleKeydown: jest.fn(),
        focusIndex: 2,
        selectedIndex: 1,
        _keyManager: {
          onKeydown: jest.fn(),
        },
      };
      const tabgroup: Partial<MatTabGroup> = {
        _tabHeader: tabHeader as unknown as MatTabHeader,
      };
      component.nuverialTabs.tabgroup = tabgroup as MatTabGroup;

      const event = new KeyboardEvent('keydown', { code: 'Enter' });
      const spy = jest.spyOn(component, 'openConfirmationDialog');

      // Act
      component.ngAfterViewInit();
      component.handleKeydown(event, tabHeader as unknown as MatTabHeader);

      // Assert
      expect(spy).toHaveBeenCalledWith(2, component.nuverialTabs.tabgroup._tabHeader);
    });

    it('should not call openConfirmationDialog when Enter or Space key is pressed and focusIndex is the same as selectedIndex', () => {
      // Arrange
      const tabHeader = {
        _handleKeydown: jest.fn(),
        focusIndex: 1,
        selectedIndex: 1,
        _keyManager: {
          onKeydown: jest.fn(),
        },
      };
      const tabgroup: Partial<MatTabGroup> = {
        _tabHeader: tabHeader as unknown as MatTabHeader,
      };
      component.nuverialTabs.tabgroup = tabgroup as MatTabGroup;

      const event = new KeyboardEvent('keydown', { code: 'Space' });
      const spy = jest.spyOn(component, 'openConfirmationDialog');

      // Act
      component.ngAfterViewInit();
      component.handleKeydown(event, tabHeader as unknown as MatTabHeader);

      // Assert
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call _keyManager.onKeydown for other key codes', () => {
      // Arrange
      const tabHeader = {
        _handleKeydown: jest.fn(),
        focusIndex: 2,
        selectedIndex: 1,
        _keyManager: {
          onKeydown: jest.fn(),
        },
      };
      const tabgroup: Partial<MatTabGroup> = {
        _tabHeader: tabHeader as unknown as MatTabHeader,
      };
      component.nuverialTabs.tabgroup = tabgroup as MatTabGroup;

      const event = new KeyboardEvent('keydown', { code: 'ArrowUp' });

      // Act
      component.ngAfterViewInit();
      component.handleKeydown(event, tabHeader as unknown as MatTabHeader);

      // Assert
      expect(component.nuverialTabs.tabgroup._tabHeader['_keyManager'].onKeydown).toHaveBeenCalledWith(event);
    });
  });
});
