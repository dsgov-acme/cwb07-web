/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injector, Type } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CustomTagsService } from '@formio/angular';
import { Components } from 'formiojs';
import { createCustomFormioComponent } from './create-custom-component';
import { FormioCustomComponentInfo } from './elements.common';

export function registerCustomTag(tag: string, injector: Injector): void {
  injector.get(CustomTagsService).addCustomTag(tag);
}

export function registerCustomTags(tags: string[], injector: Injector): void {
  tags.forEach(tag => registerCustomTag(tag, injector));
}

export function registerCustomFormioComponent(options: FormioCustomComponentInfo, angularComponent: Type<any>, injector: Injector): void {
  registerCustomTag(options.selector, injector);

  const complexCustomComponent = createCustomElement(angularComponent, { injector });
  customElements.define(options.selector, complexCustomComponent);

  Components.setComponent(options.type, createCustomFormioComponent(options));
}

export function registerCustomFormioComponentWithClass(
  options: FormioCustomComponentInfo,
  angularComponent: Type<any>,
  formioClass: any,
  injector: Injector,
): void {
  registerCustomTag(options.selector, injector);

  const complexCustomComponent = createCustomElement(angularComponent, { injector });
  customElements.define(options.selector, complexCustomComponent);

  Components.setComponent(options.type, formioClass);
}
