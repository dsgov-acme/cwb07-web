import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { FormRendererService } from '../../../../services';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../../test';
import { FormlyFileUploaderComponent } from './file-uploader.component';

global.structuredClone = jest.fn(obj => obj);

const mockModel = {};

const mockFields: FormlyFieldConfig[] = [
  {
    className: 'flex-half',
    key: 'documents.document1',
    props: {
      label: 'Document 1',
      multiple: false,
    },
    type: 'nuverialFileUploader',
  },
];

const getFixtureByTemplate = async (props?: Record<string, unknown>) => {
  const template = MockTemplate;
  const { fixture } = await render(template, {
    componentProperties: {
      ...MockDefaultComponentProperties,
      fields: mockFields,
      model: mockModel,
      ...props,
    },
    imports: [
      ReactiveFormsModule,
      FormlyModule.forRoot({
        ...MockDefaultFormlyModuleConfiguration,
        types: [{ component: FormlyFileUploaderComponent, name: 'nuverialFileUploader' }],
      }),
    ],
    providers: [
      MockProvider(LoggingService),
      MockProvider(NuverialSnackBarService),
      MockProvider(DocumentFormService, {
        openDocument$: jest.fn().mockImplementation(() => of(new Blob())),
        getProcessingResultsById$: jest.fn().mockImplementation(() => of([])),
      }),
      MockProvider(FormRendererService, {
        transactionId: 'testId',
      }),
    ],
  });
  const component: FormlyFileUploaderComponent = fixture.debugElement.query(By.directive(FormlyFileUploaderComponent)).componentInstance;

  return { component, fixture };
};

describe('FormlyFileUploaderComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixtureByTemplate();
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  describe('Component Inputs', () => {
    it('should have default values', async () => {
      const { component } = await getFixtureByTemplate();

      expect(component.field).toBeDefined();
      expect(component.loading).toBeFalsy();
      expect(component.field?.formControl?.value).toBeUndefined();
      expect(component.filePreview.size).toEqual(0);
      expect(component.fileStatus.size).toEqual(0);
    });
  });

  describe('documentList', () => {
    it('should be an empty array if formControl value is falsy', fakeAsync(async () => {
      const { component } = await getFixtureByTemplate();
      component.formControl.setValue(undefined);

      let result;

      component.documentList$.subscribe(res => {
        result = res;
      });
      tick();

      expect(result).toEqual([]);
    }));

    it('should return an array with the formControl value if multiple is false', fakeAsync(async () => {
      const { component } = await getFixtureByTemplate();
      component.formControl.setValue({
        documentId: 'testId',
        filename: 'test.doc',
      });
      component.field.props.multiple = false;

      let result;

      component.documentList$.subscribe(res => {
        result = res;
      });
      tick();

      expect(result).toEqual([
        {
          documentId: 'testId',
          filename: 'test.doc',
          failed: false,
        },
      ]);

      component.formControl.setValue(undefined);
    }));

    it('should return the formControl value if multiple is true and formControl value is an array', fakeAsync(async () => {
      const { component } = await getFixtureByTemplate();
      component.formControl.setValue([
        {
          documentId: 'testId1',
          filename: 'test.doc1',
        },
        {
          documentId: 'testId2',
          filename: 'test.doc2',
        },
      ]);
      component.field.props.multiple = true;

      let result;

      component.documentList$.subscribe(res => {
        result = res;
      });
      tick();

      expect(result).toEqual([
        {
          documentId: 'testId1',
          filename: 'test.doc1',
          failed: false,
        },
        {
          documentId: 'testId2',
          filename: 'test.doc2',
          failed: false,
        },
      ]);

      component.formControl.setValue(undefined);
    }));

    it('should set failed to true if getProcessingResults throws error', fakeAsync(async () => {
      const { component } = await getFixtureByTemplate();
      component.formControl.setValue({
        documentId: 'testId',
        filename: 'test.doc',
      });
      component.field.props.multiple = false;

      const service = ngMocks.findInstance(DocumentFormService);
      jest.spyOn(service, 'getProcessingResultsById$').mockReturnValue(throwError({ status: 410 }));

      let result;

      component.documentList$.subscribe(res => {
        result = res;
      });
      tick();

      expect(result).toEqual([
        {
          documentId: 'testId',
          filename: 'test.doc',
          failed: true,
        },
      ]);

      component.formControl.setValue(undefined);
    }));
  });

  it('get transactionId should return transactionId from FormRendererService', async () => {
    const { component } = await getFixtureByTemplate();

    expect(component.transactionId).toEqual('testId');
  });

  describe('openDocument', () => {
    it('should open the document', async () => {
      const { component } = await getFixtureByTemplate();
      const service = ngMocks.findInstance(DocumentFormService);
      const spy = jest.spyOn(service, 'openDocument$');

      component.field.props.multiple = false;
      component.formControl.setValue({ documentId: 'testId' });
      component.openDocument({ documentId: 'testId', filename: 'test.doc', failed: false });

      expect(spy).toBeCalledWith('testId');

      component.formControl.setValue(undefined);
    });

    it('should not open the document if failed is true', async () => {
      const { component } = await getFixtureByTemplate();
      const service = ngMocks.findInstance(DocumentFormService);
      const spy = jest.spyOn(service, 'openDocument$');

      component.field.props.multiple = false;
      component.formControl.setValue({ documentId: 'testId' });
      component.openDocument({ documentId: 'testId', filename: 'test.doc', failed: true });

      expect(spy).not.toBeCalledWith('testId');

      component.formControl.setValue(undefined);
    });

    it('should open the document at index if multiple is true', async () => {
      const { component } = await getFixtureByTemplate();
      const service = ngMocks.findInstance(DocumentFormService);
      const spy = jest.spyOn(service, 'openDocument$');

      component.field.props.multiple = true;
      component.formControl.setValue([{ documentId: 'testId' }, { documentId: 'testId1' }]);
      component.openDocument({ documentId: 'testId1', filename: 'test1.doc', failed: false });

      expect(spy).toBeCalledWith('testId1');

      component.formControl.setValue(undefined);
    });
  });

  it('trackByFn', async () => {
    const { component } = await getFixtureByTemplate();
    const results = component.trackByFn(1);

    expect(results).toEqual(1);
  });
});
