import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UserModel } from '@dsg/shared/data-access/user-api';
import { TransactionModel } from '@dsg/shared/data-access/work-api';
import { ProfileService } from '@dsg/shared/feature/profile';
import {
  INuverialPanel,
  INuverialSelectOption,
  LoadingService,
  NuverialAccordionComponent,
  NuverialButtonComponent,
  NuverialIconComponent,
  NuverialSelectComponent,
  NuverialSelectorButtonDropdownComponent,
  TitleService,
} from '@dsg/shared/ui/nuverial';
import { PagingRequestModel } from '@dsg/shared/utils/http';
import { BehaviorSubject, Observable, map, of, switchMap, tap } from 'rxjs';
import { DashboardService } from '../../services';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NuverialButtonComponent,
    NuverialIconComponent,
    NuverialSelectComponent,
    NuverialSelectorButtonDropdownComponent,
    NuverialAccordionComponent,
  ],
  selector: 'dsg-dashboard',
  standalone: true,
  styleUrls: ['./dashboard.component.scss'],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  public pastApplicationPanel: INuverialPanel[] = [{ expanded: true, panelTitle: 'Past Applications' }];
  public profile$: Observable<UserModel | null> = this._profileService.getProfile$();

  public totalActiveTransactions = 0;
  public totalPastTransactions = 0;
  //loading states are kept in for the purpose of the load more application buttons, but not used for the spinner state
  public loadingActiveTransactions = false;
  public loadingPastTransactions = false;

  public activeTransactions$: Observable<TransactionModel[]>;
  public pastTransactions$: Observable<TransactionModel[]>;

  public selectOption: INuverialSelectOption[] = [
    {
      disabled: false,
      displayTextValue: 'Financial Benefit',
      key: 'FinancialBenefit',
      selected: false,
    },
    {
      disabled: false,
      displayTextValue: 'Unemployment Insurance Proof',
      key: 'UnemploymentInsurance',
      selected: false,
    },
    {
      disabled: false,
      displayTextValue: 'Feedback',
      key: 'Feedback',
      selected: false,
    },
  ];

  private readonly _activeTransactionsPagination = new BehaviorSubject<PagingRequestModel>(
    new PagingRequestModel({
      pageNumber: 0,
      pageSize: 20,
      sortBy: 'lastUpdatedTimestamp',
      sortOrder: 'DESC',
    }),
  );
  private readonly _pastTransactionsPagination = new BehaviorSubject<PagingRequestModel>(
    new PagingRequestModel({
      pageNumber: 0,
      pageSize: 20,
      sortBy: 'lastUpdatedTimestamp',
      sortOrder: 'DESC',
    }),
  );

  constructor(
    private readonly _router: Router,
    private readonly _profileService: ProfileService,
    private readonly _dashboardService: DashboardService,
    private readonly _titleService: TitleService,
    private readonly _loadingService: LoadingService,
  ) {
    this.activeTransactions$ = this._activeTransactionsPagination.asObservable().pipe(
      this._loadingService.switchMapWithLoading(pagination => this._dashboardService.loadActiveTransactions$(pagination)),
      switchMap(_ =>
        this._dashboardService.activeTransactions$.pipe(
          this._loadingService.switchMapWithLoading(transactionResponse => {
            return of(transactionResponse).pipe(
              tap(transactionPaginationResponse => {
                this.totalActiveTransactions = transactionPaginationResponse.pagingMetadata.totalCount;
              }),
              map(transactionPaginationResponse => {
                return transactionPaginationResponse.items;
              }),
              tap(() => (this.loadingActiveTransactions = false)),
            );
          }),
        ),
      ),
    );
    this.pastTransactions$ = this._pastTransactionsPagination.asObservable().pipe(
      this._loadingService.switchMapWithLoading(pagination => this._dashboardService.loadPastTransactions$(pagination)),
      switchMap(_ =>
        this._dashboardService.pastTransactions$.pipe(
          this._loadingService.switchMapWithLoading(transactionResponse => {
            return of(transactionResponse).pipe(
              tap(transactionPaginationResponse => {
                this.totalPastTransactions = transactionPaginationResponse.pagingMetadata.totalCount;
              }),
              map(transactionPaginationResponse => {
                return transactionPaginationResponse.items;
              }),
              tap(() => (this.loadingPastTransactions = false)),
            );
          }),
        ),
      ),
    );
  }

  public ngOnInit() {
    this._titleService.setHtmlTitle('Dashboard', true);
  }

  public ngOnDestroy() {
    this._dashboardService.cleanUp();
    this._titleService.resetHtmlTitle();
  }

  public loadMoreActiveApplications(): void {
    this.loadingActiveTransactions = true;
    const nextTransactionPagination = this._activeTransactionsPagination.value;
    nextTransactionPagination.pageNumber++;
    this._activeTransactionsPagination.next(nextTransactionPagination);
  }

  public loadMorePastApplications(): void {
    this.loadingPastTransactions = true;
    const nextTransactionPagination = this._pastTransactionsPagination.value;
    nextTransactionPagination.pageNumber++;
    this._pastTransactionsPagination.next(nextTransactionPagination);
  }

  public trackByFn(_index: number, item: unknown) {
    return item;
  }

  public createNewTransaction(selectItem: INuverialSelectOption) {
    this._router.navigate([`/dashboard/transaction/${selectItem.key}`]);
  }
}
