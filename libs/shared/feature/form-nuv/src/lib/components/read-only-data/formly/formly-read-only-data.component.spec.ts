import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { screen } from '@testing-library/dom';
import { axe } from 'jest-axe';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../test';
import { FormStateMode } from '../../forms/renderer/renderer.model';
import { FormlyReadOnlyDataComponent } from './formly-read-only-data.component';

const mockModel = {
  firstName: 'George',
  income: 1234.56,
  date: 'February 1, 2022',
  dateWithTime: '2020-05-12T23:50:21.817Z',
  number: 2345.67,
  reviewHiddenField: 'hidden text',
};

const mockFields: FormlyFieldConfig[] = [
  {
    key: 'firstName',
    props: {
      label: 'Mock plain text read-only',
      formatType: 'text',
    },
    type: 'nuverialReadOnlyData',
  },
  {
    key: 'income',
    props: {
      label: 'Mock currency read-only',
      formatType: 'currency',
      currencyPipeOptions: { currency: '$', locale: 'en-US' },
    },
    type: 'nuverialReadOnlyData',
  },
  {
    key: 'date',
    props: {
      label: 'Mock date read-only',
      formatType: 'date',
      datePipeOptions: { format: 'shortDate', locale: 'en-US', timezone: 'UTC' },
    },
    type: 'nuverialReadOnlyData',
  },
  {
    key: 'dateWithTime',
    props: {
      label: 'Mock time read-only',
      formatType: 'time',
      datePipeOptions: { format: 'shortTime', locale: 'en-US', timezone: 'UTC' },
    },
    type: 'nuverialReadOnlyData',
  },
  {
    key: 'number',
    props: {
      label: 'Mock number read-only',
      formatType: 'number',
      decimalPipeOptions: { digitsInfo: '1.2-2', locale: 'en-US' },
    },
    type: 'nuverialReadOnlyData',
  },
  {
    key: 'reviewHiddenField',
    props: {
      label: 'Mock review hidden field',
      formatType: 'text',
      hideInReviewPage: true,
    },
    type: 'nuverialReadOnlyData',
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
        types: [{ component: FormlyReadOnlyDataComponent, name: 'nuverialReadOnlyData' }],
      }),
    ],
  });
  const component = fixture.debugElement.query(By.directive(FormlyReadOnlyDataComponent)).componentInstance;
  component.formState.mode = FormStateMode.Edit;

  return { component, fixture };
};

describe('FormlyReadOnlyDataComponent', () => {
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

    expect(fixture).toBeTruthy();
  });

  it('should verify edit mode field matches input', async () => {
    const { component, fixture } = await getFixtureByTemplate();

    component.formState.mode = FormStateMode.Edit;
    fixture.detectChanges();

    const model = {
      firstName: 'George',
    };

    expect(screen.getByText(model.firstName)).toBeInTheDocument();
  });

  it('should verify review mode field matches input', async () => {
    const { component, fixture } = await getFixtureByTemplate();

    component.formState.mode = FormStateMode.Review;
    fixture.detectChanges();

    const model = {
      firstName: 'George',
    };

    expect(screen.getByText(model.firstName)).toBeInTheDocument();
  });

  it('should not appear in review mode if hideInReviewPage is true', async () => {
    const { component, fixture } = await getFixtureByTemplate();

    component.formState.mode = FormStateMode.Review;
    fixture.detectChanges();

    expect(screen.queryByText('hidden text')).toBeNull();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixtureByTemplate();
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should verify the dom', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture.nativeElement.querySelector('dsg-formly-read-only-data').id).toBe('firstName-field');
  });

  describe('Formatting pipes', () => {
    it('should format currency', async () => {
      const { fixture, component } = await getFixtureByTemplate();

      component.formState.mode = FormStateMode.Edit;
      fixture.detectChanges();

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should format date', async () => {
      const { fixture, component } = await getFixtureByTemplate();

      component.formState.mode = FormStateMode.Edit;
      fixture.detectChanges();

      expect(screen.getByText('2/1/22')).toBeInTheDocument();
    });

    it('should format time', async () => {
      const { fixture, component } = await getFixtureByTemplate();

      component.formState.mode = FormStateMode.Edit;
      fixture.detectChanges();

      expect(screen.getByText('11:50 PM')).toBeInTheDocument();
    });

    it('should format number', async () => {
      const { fixture, component } = await getFixtureByTemplate();

      component.formState.mode = FormStateMode.Edit;
      fixture.detectChanges();

      expect(screen.getByText('2,345.67')).toBeInTheDocument();
    });
  });
});
