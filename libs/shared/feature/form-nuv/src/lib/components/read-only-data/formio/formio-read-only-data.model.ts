import { Injector } from '@angular/core';
import { FormioCustomComponentInfo, registerCustomFormioComponent } from '../../../utils';
import {
  DEFAULT_COMPONENT_OPTIONS,
  defaultAriaLabelConfiguration,
  defaultCompleteConditionalPanelConfiguration,
  defaultCurrencyPipeOptionsConfiguration,
  defaultDatePipeOptionsConfiguration,
  defaultDecimalPipeOptionsConfiguration,
  defaultDisplayAccessibilityPanel,
  defaultDisplayBasicConfiguration,
  defaultDisplayPanelConfiguration,
  defaultFieldLabelConfiguration,
  defaultFieldWidthConfiguration,
  defaultHideInReviewPageConfiguration,
  defaultMaskConfiguration,
  defaultPanelTabsConfiguration,
  defaultPrefixConfiguration,
  defaultPropertyKeyConfiguration,
  defaultSuffixConfiguration,
} from '../../base';
import { FormioReadOnlyDataComponent } from './formio-read-only-data.component';

/**
 * Formio custom component documentation links
 * Angular formio custom components https://github.com/formio/angular/wiki/Custom-Components-with-Angular-Elements#define-the-options
 * Form builder https://help.form.io/developers/form-builder#overriding-behavior
 * Form builder example json configurations https://formio.github.io/formio.js/app/examples/custombuilder.html
 */

const selector = 'nuverial-read-only-data-wc';

const COMPONENT_OPTIONS: FormioCustomComponentInfo = {
  ...DEFAULT_COMPONENT_OPTIONS,
  editForm, // Optional: define the editForm of the field. Default: the editForm of a textfield
  group: 'nuverial', // Build Group
  icon: 'quote-left', // Icon
  schema: { input: false },
  selector, // custom selector. Angular Elements will create a custom html tag with this selector
  title: 'Read-Only Data', // Title of the component
  type: 'nuverialReadOnlyData', // custom type. Formio will identify the field with this type.
  weight: 0, // Optional: define the weight in the builder group
};

export function registerReadOnlyDataComponent(injector: Injector) {
  if (!customElements.get(selector)) {
    registerCustomFormioComponent(COMPONENT_OPTIONS, FormioReadOnlyDataComponent, injector);
  }
}

function editForm() {
  return {
    components: [
      {
        // Tabs
        ...defaultPanelTabsConfiguration,
        components: [
          {
            // Display Panel
            ...defaultDisplayPanelConfiguration,
            components: [
              {
                ...defaultDisplayBasicConfiguration,
                components: [
                  { ...fieldLabelConfiguration },
                  { ...filteredKeyConfiguration },
                  { ...formatTypeConfiguration },
                  { ...currencyPipeOptionsConfiguration },
                  { ...datePipeOptionsConfiguration },
                  { ...decimalPipeOptionsConfiguration },
                  { ...fontBoldConfiguration },
                  { ...fontItalicConfiguration },
                  { ...maskConfiguration },
                  { ...valuePositionConfiguration },
                  { ...defaultFieldWidthConfiguration },
                  { ...prefixConfiguration },
                  { ...suffixConfiguration },
                  { ...defaultHideInReviewPageConfiguration },
                ],
              },
              {
                ...defaultDisplayAccessibilityPanel,
                components: [{ ...defaultAriaLabelConfiguration }],
              },
            ],
          },
          {
            // Conditional Panel
            ...defaultCompleteConditionalPanelConfiguration,
          },
        ],
      },
    ],
  };
}

const filteredKeyConfiguration = {
  ...defaultPropertyKeyConfiguration,
  props: {
    allowedSchemaTypes: ['String', 'Integer', 'BigDecimal', 'Boolean', 'LocalDate', 'LocalTime'],
  },
};

const formatTypeConfiguration = {
  data: {
    values: [
      {
        label: 'Text',
        value: 'text',
      },
      {
        label: 'Rich Text',
        value: 'richText',
      },
      {
        label: 'Currency',
        value: 'currency',
      },
      {
        label: 'Date',
        value: 'date',
      },
      {
        label: 'Time',
        value: 'time',
      },
      {
        label: 'Number',
        value: 'number',
      },
    ],
  },
  dataSrc: 'values',
  defaultValue: 'text',
  input: true,
  key: 'props.formatType',
  label: 'Formatting',
  tooltip: 'Sets the formatting of the read-only data',
  type: 'select',
  validate: { required: true },
};

const fontItalicConfiguration = {
  conditional: { json: { '!==': [{ var: 'data.props.formatType' }, 'richText'] } },
  key: 'props.formatItalic',
  label: 'Italic',
  tooltip: 'Controls whether the text is italicized',
  type: 'checkbox',
};

const fontBoldConfiguration = {
  conditional: { json: { '!==': [{ var: 'data.props.formatType' }, 'richText'] } },
  key: 'props.formatBold',
  label: 'Bold',
  tooltip: 'Controls whether the text is bolded',
  type: 'checkbox',
};

const maskConfiguration = {
  ...defaultMaskConfiguration,
  conditional: { json: { '!==': [{ var: 'data.props.formatType' }, 'richText'] } },
};

const prefixConfiguration = {
  ...defaultPrefixConfiguration,
  conditional: { json: { '!==': [{ var: 'data.props.formatType' }, 'richText'] } },
};

const suffixConfiguration = {
  ...defaultSuffixConfiguration,
  conditional: { json: { '!==': [{ var: 'data.props.formatType' }, 'richText'] } },
};

export const valuePositionConfiguration = {
  data: {
    values: [
      {
        label: 'Right',
        value: 'right',
      },
      {
        label: 'Above',
        value: 'above',
      },
      {
        label: 'Below',
        value: 'below',
      },
    ],
  },
  dataSrc: 'values',
  defaultValue: 'right',
  key: `props.valuePosition`,
  label: 'Value Position',
  tooltip: 'Where to display the value relative to the label.',
  type: 'select',
  validate: { required: true },
};

export const fieldLabelConfiguration = {
  collapsible: true,
  components: [
    {
      ...defaultFieldLabelConfiguration,
      validate: { required: false },
    },
    {
      data: {
        values: [
          {
            label: 'Extra Large',
            value: 'xlarge',
          },
          {
            label: 'Large',
            value: 'large',
          },
          {
            label: 'Normal',
            value: 'normal',
          },
        ],
      },
      dataSrc: 'values',
      defaultValue: 'normal',
      input: true,
      key: 'props.labelSize',
      label: 'Label Font Size',
      tooltip: 'Sets the font size of the label',
      type: 'select',
    },
    {
      key: 'props.labelBold',
      label: 'Bold',
      tooltip: 'Controls whether the label is bolded',
      type: 'checkbox',
    },
    {
      key: 'props.labelItalic',
      label: 'Italic',
      tooltip: 'Controls whether the label is italicized',
      type: 'checkbox',
    },
  ],
  theme: 'default',
  title: 'Label Formatting Options',
  tooltip: 'Formatting options for the label',
  type: 'panel',
  weight: 10,
};

const currencyPipeOptionsConfiguration = {
  ...defaultCurrencyPipeOptionsConfiguration,
  conditional: { json: { '===': [{ var: 'data.props.formatType' }, 'currency'] } },
};

const datePipeOptionsConfiguration = {
  ...defaultDatePipeOptionsConfiguration,
  conditional: { json: { or: [{ '===': [{ var: 'data.props.formatType' }, 'date'] }, { '===': [{ var: 'data.props.formatType' }, 'time'] }] } },
};

const decimalPipeOptionsConfiguration = {
  ...defaultDecimalPipeOptionsConfiguration,
  conditional: { json: { '===': [{ var: 'data.props.formatType' }, 'number'] } },
};
