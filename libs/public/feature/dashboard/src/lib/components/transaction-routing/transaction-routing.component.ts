import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationSkipped, Router, RouterModule } from '@angular/router';
import { FormRendererComponent, FormRendererService } from '@dsg/shared/feature/form-nuv';
import { INuverialBreadCrumb, LoadingService, NuverialBreadcrumbComponent, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { EMPTY, catchError, filter, take, tap } from 'rxjs';
import { IntakeFormComponent } from '../intake/intake-form.component';
import { ReadonlyComponent } from '../readonly';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormRendererComponent, NuverialBreadcrumbComponent, RouterModule, IntakeFormComponent, ReadonlyComponent],
  selector: 'dsg-intake-form-router',
  standalone: true,
  styleUrls: ['./transaction-routing.component.scss'],
  templateUrl: './transaction-routing.component.html',
})
export class TransactionRoutingComponent implements OnInit, OnDestroy {
  public breadCrumbs: INuverialBreadCrumb[] = [{ label: 'Dashboard', navigationPath: '/dashboard' }];
  public loadTransactionDetails$ = this._route.paramMap.pipe(
    this._loadingService.switchMapWithLoading(params => {
      const transactionId = params.get('transactionId') ?? '';

      // Check if the transactionId is in the format of a UUID
      const saved = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(transactionId);

      return this._formRendererService.loadTransactionDetails$(transactionId, saved);
    }),
    catchError(_error => {
      this._nuverialSnackBarService.notifyApplicationError();

      return EMPTY;
    }),
    tap(([_, transactionModel]) => {
      if (!transactionModel) {
        return;
      }

      if (transactionModel.activeTasks.length) {
        const queryParams: Record<string, string> = {};
        if (this._resume === 'true') {
          queryParams['resume'] = this._resume;
        } else if (this._route.snapshot.queryParams['first-save']) {
          queryParams['first-save'] = 'true';
        }

        const editExtras = { queryParams: queryParams, replaceUrl: true };
        this._router.navigate(['/dashboard', 'transaction', transactionModel.id], editExtras);
      } else {
        this._router.navigate(['/dashboard', 'transaction', transactionModel.id, 'readonly'], { replaceUrl: true });
      }
    }),
  );

  private readonly _resume = this._route.snapshot.queryParams['resume'];

  constructor(
    private readonly _formRendererService: FormRendererService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _loadingService: LoadingService,
  ) {}

  public ngOnInit(): void {
    // Prevent flickering of the child component before navigation finishes
    this._router.events
      .pipe(
        // NavigationSkipped the base route or refresh, NavigationEnd for all other child routes
        filter(e => e instanceof NavigationEnd || e instanceof NavigationSkipped),
        tap(() => {
          this._changeDetectorRef.markForCheck();
        }),
        take(1),
      )
      .subscribe();
  }

  public ngOnDestroy(): void {
    this._formRendererService.cleanUp();
  }
}
