import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, NavigationEnd, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TransactionActiveTasksMock, TransactionModel, TransactionModelMock } from '@dsg/shared/data-access/work-api';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import { MockProvider, ngMocks } from 'ng-mocks';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { DashboardCategoryMock, DashboardConfigurationMock } from '../../models';
import { DashboardService } from '../../services';
import { TransactionRoutingComponent } from './transaction-routing.component';

describe('TransactionRoutingComponent', () => {
  let component: TransactionRoutingComponent;
  let fixture: ComponentFixture<TransactionRoutingComponent>;
  let mockLoadingService: { loading$: BehaviorSubject<boolean> };
  const routerEventsSubject = new Subject<NavigationEnd>();
  const transaction = new BehaviorSubject<TransactionModel>(TransactionModelMock);

  beforeEach(async () => {
    mockLoadingService = {
      loading$: new BehaviorSubject<boolean>(false),
    };
    await TestBed.configureTestingModule({
      imports: [CommonModule, RouterTestingModule.withRoutes([]), NoopAnimationsModule, MatSnackBarModule],
      providers: [
        MockProvider(Router, {
          events: routerEventsSubject.asObservable(),
          navigate: jest.fn(),
        }),
        MockProvider(DashboardService, {
          getDashboardCategoryByRoute: jest.fn().mockImplementation(() => DashboardCategoryMock),
          getDashboardConfiguration: jest.fn().mockImplementation(() => DashboardConfigurationMock),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ category: 'testCategory' })),
          },
        },
        MockProvider(FormRendererService, {
          transaction$: transaction,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionRoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it("should reflect loading state based on LoadingService's loading$ observable", fakeAsync(() => {
    let loadingState = false;
    mockLoadingService.loading$.subscribe(state => (loadingState = state));

    mockLoadingService.loading$.next(true);

    routerEventsSubject.next(new NavigationEnd(1, 'test', 'test'));
    tick();

    expect(loadingState).toBeTruthy();
    mockLoadingService.loading$.next(false);
    tick();
    expect(loadingState).toBeFalsy();
  }));

  it('should navigate to readonly if no active tasks', done => {
    const routerService = ngMocks.findInstance(Router);
    const routerSpy = jest.spyOn(routerService, 'navigate');

    const route = ngMocks.findInstance(ActivatedRoute);

    transaction.next(TransactionModelMock);

    component.loadTransactionDetails$.subscribe(() => {
      expect(routerSpy).toHaveBeenCalledWith(['readonly'], { relativeTo: route, replaceUrl: true });
      done();
    });
  });

  it('should navigate with query params if no active tasks', done => {
    const transactionModelActiveTasksMock = {
      ...TransactionModelMock,
      activeTasks: TransactionActiveTasksMock,
    } as TransactionModel;

    transaction.next(transactionModelActiveTasksMock);

    const routerService = ngMocks.findInstance(Router);
    const routerSpy = jest.spyOn(routerService, 'navigate');

    const route = ngMocks.findInstance(ActivatedRoute);

    fixture.detectChanges();

    component.loadTransactionDetails$.subscribe(() => {
      expect(routerSpy).toHaveBeenCalledWith([], { queryParams: { resume: true }, relativeTo: route, replaceUrl: true });
      done();
    });
  });
});
