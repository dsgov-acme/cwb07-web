import { hasModifierKey } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTab, MatTabHeader } from '@angular/material/tabs';
import { IRendererFormConfigurationSchema } from '@dsg/shared/data-access/work-api';
import {
  AgencyDetailsReviewRendererOptions,
  FormRendererComponent,
  FormRendererService,
  FormStateMode,
  NuvalenceFormRendererOptions,
} from '@dsg/shared/feature/form-nuv';
import {
  ActiveTabChangeEvent,
  INuverialTab,
  NuverialBreadcrumbComponent,
  NuverialIconComponent,
  NuverialTabKeyDirective,
  NuverialTabsComponent,
  UnsavedChangesService,
} from '@dsg/shared/ui/nuverial';
import { AccessControlService } from '@dsg/shared/utils/access-control';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, Observable, take, tap } from 'rxjs';
import { DocumentsReviewComponent } from '../documents-review';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormRendererComponent,
    DocumentsReviewComponent,
    NuverialBreadcrumbComponent,
    NuverialTabsComponent,
    NuverialIconComponent,
    NuverialTabKeyDirective,
  ],
  selector: 'dsg-review-form',
  standalone: true,
  styleUrls: ['./review-form.component.scss'],
  templateUrl: './review-form.component.html',
})
export class ReviewFormComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(NuverialTabsComponent, { static: true }) public nuverialTabs!: NuverialTabsComponent;

  public rendererOptions: NuvalenceFormRendererOptions = AgencyDetailsReviewRendererOptions;

  public formRendererConfiguration$?: Observable<IRendererFormConfigurationSchema[]> = this._formRendererService.formConfiguration$.pipe(
    map(formConfigurationModel => formConfigurationModel?.toReviewForm()),
  );

  public readonly detailsIcon?: INuverialTab['suffixIcon'] = this._accessControlService.isAuthorized('transaction-management-write')
    ? {
        ariaLabel: 'Edit',
        iconName: 'edit',
      }
    : undefined;

  public tabs: INuverialTab[] = [
    {
      key: 'details',
      label: 'Claimant Information',
      ...(this._accessControlService.isAuthorized('transaction-management-write') && { suffixIcon: this.detailsIcon }),
    },
    { key: 'documents', label: 'Documents' },
  ];

  constructor(
    private readonly _formRendererService: FormRendererService,
    private readonly _transactionDetailService: TransactionDetailService,
    private readonly _unsavedChangesService: UnsavedChangesService,
    private readonly _accessControlService: AccessControlService,
  ) {}

  public ngOnInit() {
    this._formRendererService.completeEdit$
      .pipe(
        tap(() => this.toggleEditMode(false)),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public ngOnDestroy() {
    this._toReviewMode();
  }

  public toggleEditMode(resetFormState = true): void {
    const detailsTab = this.tabs.find(tab => tab.key === 'details');

    if (!detailsTab) return;

    if (this.rendererOptions.formState.mode === FormStateMode.Edit) {
      this._toReviewMode(resetFormState);
      detailsTab.suffixIcon = this.detailsIcon;

      return;
    }

    this._toEditMode();
  }

  public handleActiveTabChange(event: ActiveTabChangeEvent): void {
    const detailsTab = this.tabs.find(tab => tab.key === 'details');

    if (detailsTab && event.tab.key === 'details') {
      detailsTab.suffixIcon = this.detailsIcon;

      return;
    }

    this._toReviewMode();
    delete detailsTab?.suffixIcon;
  }

  public openConfirmationDialog(index: number, tabHeader: MatTabHeader) {
    const proceed = () => {
      tabHeader.focusIndex = index;
      this.nuverialTabs.tabgroup.selectedIndex = index;
    };

    const save = () => {
      tabHeader.focusIndex = index;

      this._unsavedChangesService.saveAndContinue();
      this._unsavedChangesService.saving$
        .pipe(
          filter(saving => !saving),
          tap(() => (this.nuverialTabs.tabgroup.selectedIndex = index)),
          take(1),
        )
        .subscribe();
    };

    if (this._unsavedChangesService.hasUnsavedChanges) {
      this._unsavedChangesService.openConfirmationModal$(proceed, save).pipe(take(1)).subscribe();
    } else {
      proceed();
    }
  }

  public ngAfterViewInit() {
    // Override _handleClick to show confirmation dialog
    this.nuverialTabs.tabgroup._handleClick = (_tab: MatTab, tabHeader: MatTabHeader, index: number) => {
      if (this.nuverialTabs.tabgroup.selectedIndex != index) this.openConfirmationDialog(index, tabHeader);
    };

    // Override _handleKeydown in setTimeout to give time for Angular to paint the mat-tab-header
    setTimeout(() => {
      const tabHeader = this.nuverialTabs.tabgroup._tabHeader;
      tabHeader._handleKeydown = (event: KeyboardEvent) => {
        this.handleKeydown(event, tabHeader);
      };
    });
  }

  public handleKeydown(event: KeyboardEvent, tabHeader: MatTabHeader) {
    if (hasModifierKey(event)) {
      return;
    }

    switch (event.code) {
      case 'Enter':
      case 'Space':
        if (tabHeader.focusIndex !== tabHeader.selectedIndex) {
          this.openConfirmationDialog(tabHeader.focusIndex, tabHeader);
        }
        break;
      default:
        tabHeader['_keyManager'].onKeydown(event);
    }
  }

  private _toReviewMode(resetFormState = true): void {
    this._transactionDetailService.setFooterActionsEnabled(true);

    // We don't need to reset the form when cancel action is clicked since that is handled by the steps component
    if (resetFormState) {
      this.rendererOptions.formState.mode = FormStateMode.Review;
      this.rendererOptions.resetModel?.();
      this._formRendererService.resetFormErrors();
    }
  }

  private _toEditMode(): void {
    const detailsTab = this.tabs.find(tab => tab.key === 'details');

    this._transactionDetailService.setFooterActionsEnabled(false);
    this.rendererOptions.formState.mode = FormStateMode.Edit;
    delete detailsTab?.suffixIcon;
  }
}
