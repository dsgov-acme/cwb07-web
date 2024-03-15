import { FooterAction } from '@dsg/shared/ui/nuverial';
import { BaseFormlyFieldProperties } from '../../base';

export interface FormlyStepFieldProperties extends BaseFormlyFieldProperties {
  stepKey?: string;
}

export enum Actions {
  cancel = 'cancel',
  closeModal = 'close_modal',
  next = 'next',
  previous = 'previous',
  update = 'update',
}

export interface FormFooterActions {
  closeModal: FooterAction;
  previous: FooterAction;
  next: FooterAction;
}

// Hardcoded base actions for intake form: "Back" and "Save & Continue"
export const BaseFooterActions: FormFooterActions = {
  closeModal: {
    key: Actions.closeModal,
    uiClass: 'Secondary',
    uiLabel: 'Cancel',
  },
  next: {
    key: Actions.next,
    uiClass: 'Primary',
    uiLabel: 'Save & Continue',
  },
  previous: {
    key: Actions.previous,
    uiClass: 'Secondary',
    uiLabel: 'Back',
  },
};
