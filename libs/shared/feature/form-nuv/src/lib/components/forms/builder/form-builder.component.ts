import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DoCheck, ElementRef, Injector, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  FormConfigurationModel,
  IFormConfigurationSchema,
  IFormMetaData,
  IRendererFormConfigurationSchema,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import {
  FooterAction,
  INuverialBreadCrumb,
  INuverialTab,
  LoadingService,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialFooterActionsComponent,
  NuverialIconComponent,
  NuverialJsonEditorWrapperComponent,
  NuverialSelectorButtonComponent,
  NuverialSlideToggleComponent,
  NuverialSnackBarService,
  NuverialSplitAreaComponent,
  NuverialTabKeyDirective,
  StepperFadeInOut,
} from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormBuilderComponent as FormIOBuilderComponent, FormioForm, FormioModule, FormioOptions } from '@formio/angular';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { IOutputData } from 'angular-split';
import { BehaviorSubject, EMPTY, Observable, Subject, Subscription, catchError, forkJoin, of, take, tap } from 'rxjs';
import { FormBuilderModule } from '../../../form-builder.module';
import { FormBuilderService, SchemaTreeService } from '../../../services';
import { FormIOChangeEvent, applyJsonEditorErrors } from '../../../utils';
import { registerAddressComponent } from '../../advanced/address';
import { registerFileUploadComponent, registerMultipleFileUploadComponent } from '../../advanced/file-upload';
import { registerObjectListComponent } from '../../advanced/form-list';
import { registerLogicValidatorComponent } from '../../advanced/logic-validator';
import { registerCheckboxComponent } from '../../checkbox';
import { registerCheckboxCardComponent } from '../../checkbox-card';
import { registerDateInputComponent } from '../../date-input/formio/date-input.model';
import { registerDatePickerComponent } from '../../date-picker';
import { registerDateRangePickerComponent } from '../../date-range-picker';
import { registerReadOnlyDataComponent } from '../../read-only-data';
import { registerRelativeDateInputComponent } from '../../relative-date-input/relative-date-input.model';
import { registerRichTextEditorComponent } from '../../rich-text/editor';
import { SchemaKeySelectorComponent } from '../../schema-key-selector/schema-key-selector.component';
import { registerSchemaKeySelectorComponent } from '../../schema-key-selector/schema-key-selector.model';
import { registerSectionHeaderComponent } from '../../section-header';
import { registerSelectComponent } from '../../select';
import { registerSimpleChoiceQuestionsComponent } from '../../simple-choice-questions';
import { overrideWizardPanel } from '../../steps';
import { registerTextAreaComponent } from '../../text-area';
import { registerTextContentComponent } from '../../text-content';
import { registerTextInputComponent } from '../../text-input';
import { BuilderHeaderComponent } from '../header/builder-header.component';
import { FormRendererComponent } from '../renderer/form-renderer.component';
import { AdminBuilderIntakeRendererOptions, AdminBuilderReviewRendererOptions, NuvalenceFormRendererOptions } from '../renderer/renderer.model';
import { FORM_BUILDER_OPTIONS } from './form-builder.model';

const CONTEXT = 'FormBuilderComponent';

export enum SelectorTabsKeys {
  VISUAL = 'visual',
  JSON = 'json',
}

@UntilDestroy()
@Component({
  animations: [StepperFadeInOut],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormioModule,
    FormBuilderModule,
    FormRendererComponent,
    NuverialButtonComponent,
    NuverialBreadcrumbComponent,
    NuverialSelectorButtonComponent,
    NuverialJsonEditorWrapperComponent,
    NuverialTabKeyDirective,
    NgJsonEditorModule,
    BuilderHeaderComponent,
    SchemaKeySelectorComponent,
    NuverialSplitAreaComponent,
    NuverialIconComponent,
    NuverialSlideToggleComponent,
    NuverialFooterActionsComponent,
  ],
  selector: 'dsg-form-builder',
  standalone: true,
  styleUrls: ['./form-builder.component.scss'],
  templateUrl: './form-builder.component.html',
})
export class FormBuilderComponent implements DoCheck, OnDestroy {
  @ViewChild('splitArea', { read: ElementRef }) public readonly splitAreaRef!: ElementRef<HTMLDivElement>;
  @ViewChild(NuverialSplitAreaComponent) private readonly _splitArea!: NuverialSplitAreaComponent;

  public formioComponent: FormIOBuilderComponent | undefined;
  public keyState = '';

  public showPreview = false;
  public showDataModel = false;
  public changedElement: Subscription = new Subscription();
  public area2InitialSize = 0;

  public options = FORM_BUILDER_OPTIONS as FormioOptions;

  // formly
  public readonly intakeFormFields$: Observable<IRendererFormConfigurationSchema[]> = this._formBuilderService.intakeFormFields$;
  public readonly reviewFormFields$: Observable<IRendererFormConfigurationSchema[]> = this._formBuilderService.reviewFormFields$;
  public readonly builderFormFields$: Observable<FormioForm> = this._formBuilderService.builderFormFields$;
  public metaDataFields$: Observable<IFormMetaData> = this._formBuilderService.metaDataFields$;

  public intakeRendererOptions: NuvalenceFormRendererOptions = AdminBuilderIntakeRendererOptions;
  public reviewRendererOptions: NuvalenceFormRendererOptions = AdminBuilderReviewRendererOptions;

  public formData$?: Observable<Record<string, unknown>> = of({});
  public jsonFormData$?: Observable<Record<string, unknown>>;
  public jsonForm: IFormConfigurationSchema = {};

  public formioJson: FormioForm['components'];
  public formlyJson?: IRendererFormConfigurationSchema[];

  public selectorTabs: INuverialTab[] = [
    { key: 'visual', label: 'Visual' },
    { key: 'json', label: 'JSON' },
  ];

  public previewSelectorTabs: INuverialTab[] = [
    { key: 'intake', label: 'Intake' },
    { key: 'review', label: 'Review' },
  ];

  public breadCrumbs: INuverialBreadCrumb[] = [
    { label: 'Transaction Configurations', navigationPath: '/admin/transaction-definitions' },
    { label: '', navigationPath: '/admin/transaction-definitions' },
  ];

  public actions: FooterAction[] = [
    {
      key: 'save',
      uiClass: 'Primary',
      uiLabel: 'Save',
    },
  ];

  public selectorTabsKeys = SelectorTabsKeys;
  public currentSelectorTab: string = this.selectorTabs[0].key;
  public currentPreviewSelectorTab: string = this.previewSelectorTabs[0].key;
  public navigationPath!: string;

  public loadForm$ = this._route.paramMap.pipe(
    tap(_ => {
      this._cdr.detectChanges();
    }),
    this._loadingService.switchMapWithLoading(params => {
      this._transactionDefinitionKey = params.get('transactionDefinitionKey') ?? '';
      this._formConfigurationKey = params.get('formConfigurationKey') ?? '';

      return forkJoin({
        formConfiguration: this._formBuilderService.getFormConfigurationByKey$(this._transactionDefinitionKey, this._formConfigurationKey),
        transactionDefinition: this._workApiRoutesService.getTransactionDefinitionByKey$(this._transactionDefinitionKey),
      });
    }),
    tap(({ transactionDefinition }) => {
      this.breadCrumbs[1].label = transactionDefinition.name;
      this.breadCrumbs[1].navigationPath = `${this.breadCrumbs[1].navigationPath}/${this._transactionDefinitionKey}`;
      this.breadCrumbs = structuredClone(this.breadCrumbs);

      const schemaKey = transactionDefinition.schemaKey;
      this._schemaTreeService.getFormSchemaTree$(schemaKey).pipe(take(1)).subscribe();
    }),
    catchError(_error => {
      this._nuverialSnackBarService.notifyApplicationError();

      return EMPTY;
    }),
    take(1),
  );

  private readonly _formData: BehaviorSubject<Record<string, unknown>> = new BehaviorSubject({});
  private readonly _jsonFormData: BehaviorSubject<Record<string, unknown>> = new BehaviorSubject({});
  private _transactionDefinitionKey!: string;
  private _formConfigurationKey!: string;
  private readonly _formioDestroy = new Subject<void>();

  constructor(
    private readonly _injector: Injector,
    private readonly _formBuilderService: FormBuilderService,
    private readonly _loggingService: LoggingService,
    private readonly _route: ActivatedRoute,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _renderer: Renderer2,
    private readonly _schemaTreeService: SchemaTreeService,
    private readonly _loadingService: LoadingService,
  ) {
    overrideWizardPanel();
    registerAddressComponent(this._injector);
    registerCheckboxCardComponent(this._injector);
    registerCheckboxComponent(this._injector);
    registerDateInputComponent(this._injector);
    registerDatePickerComponent(this._injector);
    registerDateRangePickerComponent(this._injector);
    registerFileUploadComponent(this._injector);
    registerMultipleFileUploadComponent(this._injector);
    registerLogicValidatorComponent(this._injector);
    registerObjectListComponent();
    registerRelativeDateInputComponent(this._injector);
    registerRichTextEditorComponent(this._injector);
    registerSchemaKeySelectorComponent(this._injector);
    registerSectionHeaderComponent(this._injector);
    registerSelectComponent(this._injector);
    registerSimpleChoiceQuestionsComponent(this._injector);
    registerTextAreaComponent(this._injector);
    registerTextContentComponent(this._injector);
    registerTextInputComponent(this._injector);
    registerReadOnlyDataComponent(this._injector);
    this.jsonFormData$ = this._jsonFormData.asObservable();
  }

  @ViewChild('formio') public set formio(component: FormIOBuilderComponent) {
    if (!component) {
      this._formioDestroy.next();
    }

    if (component) {
      if (!this.formioJson) {
        this.updateFormRendering(component.form?.components);
        this._cdr.detectChanges();
      }

      this.formioComponent = component;
    }
  }

  public ngOnDestroy(): void {
    this._formBuilderService.cleanUp();
  }

  /*
  This ngDoCheck is needed to maintain the max-width of .mat-horizontal-stepper-header-container for it to be used in the split area.
  Max-width is set to the computed width of the second split area whenever the component doesn't have max-width.
  */
  public ngDoCheck(): void {
    if (
      this.splitAreaRef?.nativeElement?.querySelector('.mat-horizontal-stepper-header-container') &&
      !(this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container') as HTMLElement).style.maxWidth
    ) {
      this._renderer.setStyle(
        this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container'),
        'max-width',
        `${this.splitAreaRef.nativeElement.querySelector('.second-area')?.getBoundingClientRect().width}px`,
      );
    }
  }

  // We need to manage the max-width of .mat-horizontal-stepper-header-container whenever the split area is resized
  public onSplitDrag(value: IOutputData) {
    if (this.splitAreaRef?.nativeElement?.querySelector('.mat-horizontal-stepper-header-container')) {
      this._renderer.setStyle(this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container'), 'max-width', `${value.sizes[1]}px`);
    }
  }

  public onFormBuilderChanges(event: object) {
    const changeEvent = event as FormIOChangeEvent;

    if (changeEvent.type === 'updateComponent') {
      // Only run the error check if the JSON editor is opened
      if (document.querySelector<HTMLDivElement>('div.formio-component-componentJson')) {
        if (applyJsonEditorErrors(changeEvent.component, this._renderer)) return;
      }
      // component.key and component.type should be defined at this point
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let componentKey = changeEvent.component.key!;
      if (this.keyState !== componentKey) {
        this.keyState = componentKey;
        if (!componentKey) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          componentKey = changeEvent.component.type!;
        }
        this._schemaTreeService.setComponentKey(componentKey);
        this._schemaTreeService.setComponentUpdateFormConfig(changeEvent.form?.components as IFormConfigurationSchema[]);
      }
    } else if (['addComponent', 'saveComponent', 'deleteComponent'].includes(changeEvent.type)) {
      this.keyState = '';
      this._schemaTreeService.cleanUp();
      this.updateFormRendering(this.formioComponent?.form?.components);

      // Clear the preview formly model
      this._formData.next({});
      this._jsonFormData.next({});
    }
  }

  public onTabSelect(event: string, formComponents?: FormioForm): void {
    if (formComponents) {
      this.jsonForm = new FormConfigurationModel(formComponents.components, true).toFormioJson();
    }
    this.currentSelectorTab = event;
  }

  public onPreviewTabSelect(event: string): void {
    this.currentPreviewSelectorTab = event;
  }

  public trackByFn(index: number) {
    return index;
  }

  public updateJson(formComponents?: FormioForm['components']) {
    if (!formComponents) return;
    this.updateFormRendering(formComponents);
  }

  public togglePreview() {
    if (this.showPreview) {
      this._splitArea.setArea2Width(0);
    } else {
      this._splitArea.setArea2Width(window.innerWidth / 2 - 56);
      // This is needed to make sure that the max-width of .mat-horizontal-stepper-header-container
      // is set to the computed width of the second split area, after animation has finished.
      setTimeout(() => {
        if (this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container')) {
          this._renderer.setStyle(
            this.splitAreaRef.nativeElement.querySelector('.mat-horizontal-stepper-header-container'),
            'max-width',
            `${window.innerWidth / 2 - 56}px`,
          );
        }
      }, 250);
    }
    this.showPreview = !this.showPreview;
    this._cdr.detectChanges();
  }

  public onModelChange(event: Record<string, unknown>) {
    this._jsonFormData.next({ ...event });
    this._cdr.detectChanges();
  }

  public toggleDataModel() {
    this.showDataModel = !this.showDataModel;
    this._cdr.detectChanges();
  }

  public updateFormRendering(formComponents?: FormioForm['components']): void {
    if (!formComponents) return;

    const { formioJson, formlyJson } = this._formBuilderService.updateFormComponents(formComponents);

    this._loggingService.log(CONTEXT, 'form configurations', {
      formioJson,
      formlyJson,
      fullFormioJson: formComponents,
    });
    this.formioJson = formioJson;
    this.formlyJson = formlyJson;
  }

  public saveChanges(formComponents?: FormioForm): void {
    if (!formComponents?.components) return;
    const formComponentsSchema = new FormConfigurationModel(formComponents.components, true);
    this._cdr.detectChanges();
    this._loadingService
      .observableWithLoading$(
        this._formBuilderService.updateFormConfiguration(formComponentsSchema.toFormioJson(), this._transactionDefinitionKey, this._formConfigurationKey).pipe(
          catchError(error => {
            if (error.status < 200 || error.status >= 300) {
              const errorMessage = error.error.formioValidationErrors[0]?.errorMessage || 'An unexpected error occurred.';
              this._nuverialSnackBarService.notifyApplicationError(errorMessage);
            }

            return EMPTY;
          }),
          take(1),
        ),
      )
      .subscribe();
  }
}
