import { FormlyFormOptions } from '@ngx-formly/core';

export enum FormStateMode {
  Edit = 'edit',
  Review = 'review',
}

export enum FormStateStepperMode {
  Inline = 'inline',
  Steps = 'steps',
}

export enum FormStateContext {
  AdminBuilder = 'admin-builder',
  AgencyDetails = 'agency-details',
  IntakeModal = 'intake-modal',
  PublicPortal = 'public-portal',
}

export interface NuvalenceFormRendererOptions extends FormlyFormOptions {
  formState: {
    mode: FormStateMode;
    stepperMode: FormStateStepperMode;
    context: FormStateContext;
  };
}
export const AdminBuilderIntakeRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AdminBuilder,
    mode: FormStateMode.Edit,
    stepperMode: FormStateStepperMode.Steps,
  },
};

export const AdminBuilderReviewRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AdminBuilder,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const PublicPortalIntakeRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.PublicPortal,
    mode: FormStateMode.Edit,
    stepperMode: FormStateStepperMode.Steps,
  },
};

export const PublicPortalReviewRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.PublicPortal,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const AgencyDetailsIntakeRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AgencyDetails,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const AgencyDetailsReviewRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AgencyDetails,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const IntakeModalRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.IntakeModal,
    mode: FormStateMode.Edit,
    stepperMode: FormStateStepperMode.Steps,
  },
};
