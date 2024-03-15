import { TemplateRef } from '@angular/core';

export interface INavigableTab extends INuverialTab {
  relativeRoute: string;
  useTransactionLabel?: boolean;
  showActions?: boolean;
}

export interface INuverialTab {
  count?: number;
  disabled?: boolean;
  filters?: Map<string, string>;
  key: string;
  label: string;
  suffixIcon?: {
    ariaLabel: string;
    iconName: string;
  };
  template?: TemplateRef<unknown>;
  value?: string;
}

export interface ActiveTabChangeEvent {
  index: number;
  tab: INuverialTab;
}
