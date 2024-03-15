import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DateRangePickerControl } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { screen } from '@testing-library/dom';
import { axe } from 'jest-axe';
import { MockService } from 'ng-mocks';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../test';
import { FormStateMode } from '../../forms';
import { FormlyDateRangePickerComponent } from './formly-date-range-picker.component';

const mockModel = {
  dateOne: '2024-01-20',
  mockParent: {
    dateTwo: '2024-01-25',
  },
  disabled: false,
  startView: 'month',
};

const mockFields: FormlyFieldConfig[] = [
  {
    props: {
      ariaLabel: 'date-range-picker',
      disabled: false,
      startView: 'month',
      label: 'Mock Range Picker',
      startDateKey: 'dateOne',
      endDateKey: 'mockParent.dateTwo',
    },
    type: 'nuverialDateRangePicker',
    fieldGroup: [
      {
        key: 'dateOne',
        props: {
          required: true,
        },
      },
      {
        key: 'mockParent.dateTwo',
        props: {
          required: true,
        },
      },
    ],
  },
];

const getFixtureByTemplate = async (props?: Record<string, unknown>) => {
  const template = MockTemplate;
  // const mockLogging = jest.spyOn(LoggingService.prototype, 'warn').mockImplementation();
  const { fixture } = await render(template, {
    componentProperties: {
      ...MockDefaultComponentProperties,
      fields: mockFields,
      model: mockModel,
      ...props,
    },
    imports: [
      ReactiveFormsModule,
      MatNativeDateModule,
      FormlyModule.forRoot({
        ...MockDefaultFormlyModuleConfiguration,
        types: [{ component: FormlyDateRangePickerComponent, name: 'nuverialDateRangePicker' }],
      }),
    ],
    providers: [{ provide: LoggingService, useValue: MockService(LoggingService) }],
  });
  const component = fixture.debugElement.query(By.directive(FormlyDateRangePickerComponent)).componentInstance;
  component.formState.mode = FormStateMode.Edit;
  fixture.detectChanges();

  return { component, fixture };
};

describe('FormlyDateRangePickerComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  it('should create', async () => {
    const { fixture } = await getFixtureByTemplate();
    fixture.detectChanges();

    expect(fixture).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixtureByTemplate();
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should verify the dom', async () => {
    await getFixtureByTemplate();

    expect(screen.getByText('Mock Range Picker')).toBeInTheDocument();
  });

  describe('ngOnInit', () => {
    it('should patch the date control with the formly model values', async () => {
      const { component } = await getFixtureByTemplate();
      component.ngOnInit();

      expect(component.dateControl.value['startDate']).toEqual(mockModel.dateOne);
      expect(component.dateControl.value['endDate']).toEqual(mockModel.mockParent.dateTwo);
    });
  });

  it('should verify edit mode field matches input', async () => {
    const { component, fixture } = await getFixtureByTemplate();

    component.formState.mode = FormStateMode.Edit;
    fixture.detectChanges();

    const dateOneEditText = '1/20/2024';
    const dateTwoEditText = '1/25/2024';

    expect(screen.getByDisplayValue(dateOneEditText)).toBeInTheDocument();
    expect(screen.getByDisplayValue(dateTwoEditText)).toBeInTheDocument();
  });

  it('should verify review mode field matches input', async () => {
    const { component, fixture } = await getFixtureByTemplate();

    component.formState.mode = FormStateMode.Review;
    fixture.detectChanges();

    const dateOneReviewText = '01/20/2024';
    const dateTwoReviewText = '01/25/2024';

    expect(screen.getByText(`${dateOneReviewText} - ${dateTwoReviewText}`)).toBeInTheDocument();
  });

  describe('valueChanges', () => {
    it('should update formControl on dateControl changes', async () => {
      const { component } = await getFixtureByTemplate();

      const newDateRange: DateRangePickerControl = { startDate: new Date('2020-02-10'), endDate: new Date('2020-02-15') };
      component.dateControl.setValue(newDateRange);

      expect(component.formControl.value).toEqual({
        dateOne: newDateRange.startDate,
        mockParent: {
          dateTwo: newDateRange.endDate,
        },
      });
    });
  });
});
