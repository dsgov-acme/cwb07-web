import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { TransactionData, TransactionMock, TransactionModel } from '@dsg/shared/data-access/work-api';
import { LoggingService } from '@dsg/shared/utils/logging';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { lastValueFrom, of } from 'rxjs';
import { FormRendererService } from '../../../../services/form-renderer.service';
import { FormConfigMock } from '../form-renderer.mock';
import { FormRendererModalComponent } from './form-renderer-modal.component';

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(FormRendererModalComponent, {
    providers: [
      MockProvider(MatDialogRef),
      MockProvider(LoggingService),
      MockProvider(FormRendererService, {
        closeModal$: of(),
        modalFormConfiguration$: of(),
        transaction$: of(new TransactionModel(TransactionMock)),
      }),
    ],
    ...props,
  });
  const component = fixture.componentInstance;

  component.fields$ = of(FormConfigMock);

  return { component, fixture };
};

describe('FormRendererModalComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  it('should create', async () => {
    const { fixture } = await getFixture({});

    expect(fixture).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixture({});
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  describe('formlyFields$', () => {
    it('should return a formly form configuration', async () => {
      const { component } = await getFixture({});

      expect(component.fields$).toBeTruthy();

      if (!component.fields$) return;

      const formConfiguration = await lastValueFrom(component.fields$);

      expect(formConfiguration).toEqual(FormConfigMock);
    });
  });

  describe('onModelChange', () => {
    it('should emit the modelChange event', async () => {
      const { component } = await getFixture({});
      const mockEvent: TransactionData = { test: 'test' };
      const spy = jest.spyOn(component.modelChange, 'emit');

      component.onModelChange(mockEvent);

      expect(spy).toHaveBeenCalledWith(mockEvent);
    });
  });
});

// describe('FormRendererModalComponent', () => {
//   let component: FormRendererModalComponent;
//   let fixture: ComponentFixture<FormRendererModalComponent>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [FormRendererModalComponent],
//       providers: [
//         MockProvider(MatDialogRef),
//         MockProvider(FormRendererService, {
//           closeModal$: of(),
//           modalFormConfiguration$: of(),
//           transaction$: of(),
//         }),
//         MockProvider(LoggingService),
//       ],
//     }).compileComponents();

//     fixture = TestBed.createComponent(FormRendererModalComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });
