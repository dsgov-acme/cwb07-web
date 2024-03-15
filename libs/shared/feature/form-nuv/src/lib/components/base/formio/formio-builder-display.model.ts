import { formioAlphaNumericValidator } from './formio-builder-base.model';

export const defaultDisplayPanelConfiguration = {
  key: 'display',
  label: 'Display',
  weight: 0,
};

export const defaultDisplayBasicConfiguration = {
  key: 'basic',
  theme: 'default',
  title: 'Basic',
  type: 'panel',
};

export const defaultFieldLabelConfiguration = {
  input: true,
  key: 'props.label',
  label: 'Label',
  placeholder: 'Field label',
  tooltip: 'The field label, will appear on top of the field.',
  type: 'textfield',
  validate: {
    required: true,
  },
  weight: 0,
};

export const defaultPropertyKeyConfiguration = {
  input: true,
  key: 'key',
  label: 'Property key name',
  tooltip: 'The property key of the data model.',
  type: 'nuverialSchemaKeySelector',
  validate: {
    // note: this is used in multiple places, if it is changed please update all usages
    // ex. custom: `if (row.hide) { valid = true; } else ${defaultPropertyKeyConfiguration.validate.custom}`,
    custom: `if (input === "") { valid = "Property key name is required"; }\
else if (!input) { valid = "Form schema does not exist, please configure a new schema in the transaction details page"; }
else { valid = true; }`,
    ...{ ...formioAlphaNumericValidator, required: false },
  },
  weight: 0,
};

export const defaultPlaceholderConfiguration = {
  input: true,
  key: 'props.placeholder',
  label: 'Placeholder',
  placeholder: 'Placeholder',
  tooltip: 'The placeholder text that will appear when the field is empty.',
  type: 'textfield',
  weight: 100,
};

export const defaultMaskConfiguration = {
  input: true,
  key: 'props.mask',
  label: 'Mask',
  placeholder: '(000) 000-0000',
  tooltip: 'The mask that will be applied to the input field, for mask examples see https://www.npmjs.com/package/ngx-mask',
  type: 'textfield',
  weight: 100,
};

export const defaultHintConfiguration = {
  input: true,
  key: 'props.hint',
  label: 'Hint text',
  placeholder: 'Hint',
  tooltip: 'Description text that is displayed under the field.',
  type: 'textfield',
  weight: 100,
};

export const defaultTooltipConfiguration = {
  input: true,
  key: 'props.tooltip',
  label: 'Tooltip text',
  placeholder: 'Tooltip',
  tooltip: 'Help text that displays on hover.',
  type: 'textfield',
  weight: 100,
};

export const defaultFieldWidthConfiguration = {
  data: {
    values: [
      {
        label: 'Full width',
        value: 'flex-full',
      },
      {
        label: 'Half width',
        value: 'flex-half',
      },
      {
        label: 'Third width',
        value: 'flex-third',
      },
      {
        label: 'Quarter width',
        value: 'flex-quarter',
      },
    ],
  },
  dataSrc: 'values',
  defaultValue: 'flex-half',
  input: true,
  key: 'className',
  label: 'Field width',
  tooltip: 'Controls the width of the form field',
  type: 'select',
  weight: 0,
};

export const defaultSuffixConfiguration = {
  input: true,
  key: 'props.suffix',
  label: 'Suffix',
  tooltip: 'Text to be appended at the end of the field',
  type: 'textfield',
  weight: 0,
};

export const defaultPrefixConfiguration = {
  input: true,
  key: 'props.prefix',
  label: 'Prefix',
  tooltip: 'Text to be prepended at the start of the field',
  type: 'textfield',
  weight: 0,
};

// Accessibility
export const defaultDisplayAccessibilityPanel = {
  collapsible: true,
  key: 'accessibilityPanel',
  theme: 'default',
  title: 'Accessibility',
  type: 'panel',
  weight: 10,
};

export const defaultAriaLabelConfiguration = {
  input: true,
  key: 'props.ariaLabel',
  label: 'Aria label',
  placeholder: 'Aria label',
  tooltip: 'The accessibility label, used by screen readers',
  type: 'textfield',
  validate: {},
  weight: 0,
};

export const defaultColorThemeConfiguration = {
  data: {
    values: [
      {
        label: 'Primary',
        value: 'primary',
      },
      {
        label: 'Accent',
        value: 'accent',
      },
      {
        label: 'Warn',
        value: 'warn',
      },
    ],
  },
  dataSrc: 'values',
  defaultValue: 'primary',
  key: `props.colorTheme`,
  label: 'Set color theme',
  tooltip: 'Define color theme for component.',
  type: 'select',
  weight: 0,
};

export const defaultImagePositionConfiguration = {
  data: {
    values: [
      {
        label: 'Before',
        value: 'before',
      },
      {
        label: 'Top',
        value: 'top',
      },
    ],
  },
  dataSrc: 'values',
  defaultValue: 'before',
  key: `props.imagePosition`,
  label: 'Image position',
  tooltip: 'Position that an image is displayed in the card',
  type: 'select',
  weight: 0,
};

export const defaultLabelPositionConfiguration = {
  data: {
    values: [
      {
        label: 'Before',
        value: 'before',
      },
      {
        label: 'After',
        value: 'after',
      },
    ],
  },
  dataSrc: 'values',
  defaultValue: 'after',
  key: `props.fieldLabelPosition`,
  label: 'Label position',
  tooltip: 'Position of the label',
  type: 'select',
  weight: 0,
};

export const defaultAutoCompleteConfiguration = {
  data: {
    values: [
      {
        label: 'Country',
        value: 'country',
      },
      {
        label: 'State/Province',
        value: 'address-level1',
      },
      {
        label: 'Gender',
        value: 'sex',
      },
      {
        label: 'Address Line 1',
        value: 'address-line1',
      },
      {
        label: 'Address Line 2',
        value: 'address-line2',
      },
      {
        label: 'City',
        value: 'address-level2',
      },
      {
        label: 'Zip',
        value: 'postal-code',
      },
      {
        label: 'Username',
        value: 'username',
      },
      {
        label: 'First Name',
        value: 'given-name',
      },
      {
        label: 'Last Name',
        value: 'family-name',
      },
      {
        label: 'Middle Name',
        value: 'additional-name',
      },
      {
        label: 'Email',
        value: 'email',
      },
      {
        label: 'Phone Number',
        value: 'tel',
      },
      {
        label: 'Extension Number',
        value: 'tel-extension',
      },
      {
        label: 'Job Title',
        value: 'organization-title',
      },
      {
        label: 'Company',
        value: 'organization',
      },
      {
        label: 'Name on Credit Card',
        value: 'cc-name',
      },
      {
        label: 'Credit Card Number',
        value: 'cc-number',
      },
      {
        label: 'Date of Expiration',
        value: 'cc-exp',
      },
      {
        label: 'Security Code',
        value: 'cc-csc',
      },
      {
        label: 'Language',
        value: 'language',
      },
      {
        label: 'Date of Birth',
        value: 'bday',
      },
    ],
  },
  dataSrc: 'values',
  key: 'props.autocomplete',
  label: 'Autocomplete',
  tooltip: 'Auto browser assistance in filling form field value',
  type: 'select',
  weight: 0,
};

export const defaultCurrencyPipeOptionsConfiguration = {
  collapsible: true,
  components: [
    {
      defaultValue: 'en-US',
      input: true,
      key: 'props.currencyPipeOptions.locale',
      label: 'Locale',
      tooltip: 'A locale code for the locale format rules to use.',
      type: 'textfield',
      validate: {
        required: true,
      },
    },
    {
      defaultValue: '$',
      input: true,
      key: 'props.currencyPipeOptions.currency',
      label: 'Currency Symbol',
      tooltip: 'A string containing the currency symbol or its name, such as `$` or `Canadian Dollar`.',
      type: 'textfield',
      validate: {
        required: true,
      },
    },
    {
      input: true,
      key: 'props.currencyPipeOptions.currencyCode',
      label: 'Currency Code',
      placeholder: 'USD',
      tooltip: 'The ISO 4217 (https://en.wikipedia.org/wiki/ISO_4217) currency code, such as `USD` for the US dollar and `EUR` for the euro.',
      type: 'textfield',
    },
    {
      input: true,
      key: 'props.currencyPipeOptions.digitsInfo',
      label: 'Digits Info',
      tooltip:
        'Decimal representation options, specified by a string in the following format: minIntegerDigits.minFractionDigits-maxFractionDigits. See DecimalPipe for more details.',
      type: 'textfield',
    },
  ],
  theme: 'default',
  title: 'Currency Pipe Options',
  tooltip: 'The options that will be applied to currency pipe, for examples see https://angular.io/api/common/CurrencyPipe',
  type: 'panel',
  weight: 10,
};

export const defaultDatePipeOptionsConfiguration = {
  collapsible: true,
  components: [
    {
      defaultValue: 'en-US',
      input: true,
      key: 'props.datePipeOptions.locale',
      label: 'Locale',
      tooltip: 'A locale code for the locale format rules to use.',
      type: 'textfield',
      validate: {
        required: true,
      },
    },
    {
      defaultValue: 'longDate',
      input: true,
      key: 'props.datePipeOptions.format',
      label: 'Date Format',
      tooltip: 'A string dictating the date-time components to include. See https://angular.io/api/common/DatePipe for details.',
      type: 'textfield',
      validate: {
        required: true,
      },
    },
    {
      input: true,
      key: 'props.datePipeOptions.timezone',
      label: 'Timezone',
      tooltip:
        "The time zone. A time zone offset from GMT (such as '+0430'), or a standard UTC/GMT or continental US time zone abbreviation. If not specified, uses host system settings.",
      type: 'textfield',
    },
  ],
  theme: 'default',
  title: 'Date/Time Pipe Options',
  tooltip: 'The options that will be applied to the datetime pipe, for examples see https://angular.io/api/common/DatePipe',
  type: 'panel',
  weight: 10,
};

export const defaultDecimalPipeOptionsConfiguration = {
  collapsible: true,
  components: [
    {
      defaultValue: 'en-US',
      input: true,
      key: 'props.decimalPipeOptions.locale',
      label: 'Locale',
      tooltip: 'A locale code for the locale format rules to use.',
      type: 'textfield',
      validate: {
        required: true,
      },
    },
    {
      input: true,
      key: 'props.decimalPipeOptions.digitsInfo',
      label: 'Digits Info',
      tooltip:
        'Decimal representation options, specified by a string in the following format: minIntegerDigits.minFractionDigits-maxFractionDigits. See DecimalPipe for more details.',
      type: 'textfield',
    },
  ],
  theme: 'default',
  title: 'Decimal Pipe Options',
  tooltip: 'The options that will be applied to the decimal pipe, for examples see https://angular.io/api/common/DecimalPipe',
  type: 'panel',
  weight: 10,
};

export const defaultHideInReviewPageConfiguration = {
  input: true,
  key: 'props.hideInReviewPage',
  label: 'Hide in review page',
  tooltip: 'Toggles if the content will be visible on the review page.',
  type: 'checkbox',
};
