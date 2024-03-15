import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ITransactionsPaginationResponse, TransactionMock, TransactionMock2, TransactionMock3, TransactionModel } from '@dsg/shared/data-access/work-api';
import { LoadingService, NuverialButtonComponent, TitleService } from '@dsg/shared/ui/nuverial';
import { PagingResponseModel } from '@dsg/shared/utils/http';
import { render, screen, waitFor } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockBuilder, MockProvider, ngMocks } from 'ng-mocks';
import { Observable, ReplaySubject, of, switchMap } from 'rxjs';
import { DashboardService } from '../../services';
import { DashboardComponent } from './dashboard.component';

const transactions: TransactionModel[] = [
  new TransactionModel(TransactionMock),
  new TransactionModel(TransactionMock2),
  new TransactionModel(TransactionMock3),
];

const transactionPaginationResponse = new ReplaySubject<ITransactionsPaginationResponse<TransactionModel>>(1);

const dependencies = MockBuilder(DashboardComponent)
  .keep(NuverialButtonComponent)
  .mock(LoadingService, {
    loading$: of(false),
    switchMapWithLoading: jest.fn(
      (projectionFn: (value: any, index: number) => Observable<any>) => (source$: Observable<any>) => source$.pipe(switchMap(projectionFn)),
    ),
  })
  .provide(
    MockProvider(DashboardService, {
      activeTransactions$: transactionPaginationResponse.asObservable(),

      loadActiveTransactions$: () => transactionPaginationResponse.asObservable(),
      loadPastTransactions$: () => transactionPaginationResponse.asObservable(),
      pastTransactions$: transactionPaginationResponse.asObservable(),
    }),
  )
  .provide(
    MockProvider(TitleService, {
      portalTitle$: of('Public portal'),
    }),
  )
  .build();

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  transactionPaginationResponse.next({ items: transactions, pagingMetadata: new PagingResponseModel() });

  const { fixture } = await render(DashboardComponent, {
    ...dependencies,
    ...props,
  });

  return { fixture };
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    fixture = (await getFixture({})).fixture;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no accessibility violations', async () => {
    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1, {});

    expect(results).toEqual({});
  });

  describe('transactions$', () => {
    it('should get all transactions', async () => {
      expect(screen.getByText('Transaction ID: MW')).toBeInTheDocument();
      expect(screen.getByText('Transaction ID: AB')).toBeInTheDocument();
      expect(screen.getByText('Transaction ID: CD')).toBeInTheDocument();
    });

    it('should display a documents correction message if there is an active task', async () => {
      const transaction = new TransactionModel(TransactionMock3);
      transaction.rejectedDocuments = [
        {
          dataPath: 'documents.proofOfIncome',
          index: 0,
          label: 'Test Label',
        },
      ];
      transaction.activeTasks = [{ actions: [], key: 'test', name: 'Test Task' }];

      transactionPaginationResponse.next({ items: [transaction], pagingMetadata: new PagingResponseModel() });

      fixture.detectChanges();
      await waitFor(() => {
        expect(screen.getByText('One or more documents require correction')).toBeInTheDocument();
        expect(screen.getByText('Test Label')).toBeInTheDocument();
      });
    });

    it('should not display a documents correction message if there are no active tasks', () => {
      const transaction = new TransactionModel(TransactionMock3);
      transaction.rejectedDocuments = [
        {
          dataPath: 'documents.proofOfIncome',
          index: 0,
          label: 'Test Label',
        },
      ];
      transactionPaginationResponse.next({ items: [transaction], pagingMetadata: new PagingResponseModel() });

      fixture.detectChanges();

      expect(() => screen.getByText('One or more documents require correction')).toThrow();
      expect(() => screen.getByText('Test Label')).toThrow();
    });

    describe('createNewTransaction', () => {
      it('should navigate to the selected key', async () => {
        const selectItem = { key: '123', disabled: false, displayTextValue: 'test', selected: true };
        const router = TestBed.inject(Router);
        const navigateSpy = jest.spyOn(router, 'navigate');

        component.createNewTransaction(selectItem);
        expect(navigateSpy).toHaveBeenCalledWith(['/dashboard/transaction/123']);
      });
    });
  });
  it('should load more active applications', () => {
    const initialPageNumber = component['_activeTransactionsPagination'].value.pageNumber;
    component.loadMoreActiveApplications();
    expect(component['_activeTransactionsPagination'].value.pageNumber).toBe(initialPageNumber + 1);
  });

  it('should load more past applications', () => {
    const initialPageNumber = component['_pastTransactionsPagination'].value.pageNumber;
    component.loadMorePastApplications();
    expect(component['_pastTransactionsPagination'].value.pageNumber).toBe(initialPageNumber + 1);
  });

  it('should call cleanUp method of _dashboardService on ngOnDestroy', () => {
    const dashboardServiceSpy = jest.spyOn(component['_dashboardService'], 'cleanUp');
    component.ngOnDestroy();
    expect(dashboardServiceSpy).toHaveBeenCalled();
  });

  it('should set the html title OnInit to Dashboard', async () => {
    const titleService = ngMocks.findInstance(TitleService);
    const titleSpy = jest.spyOn(titleService, 'setHtmlTitle');

    component.ngOnInit();

    expect(titleSpy).toHaveBeenCalledWith(`Dashboard`, true);
  });
});
