import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, NavigationSkipped, Router, RouterModule } from '@angular/router';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import { LoadingService } from '@dsg/shared/ui/nuverial';
import { filter, of, take, tap } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  selector: 'dsg-intake-form-router',
  standalone: true,
  styleUrls: ['./transaction-routing.component.scss'],
  templateUrl: './transaction-routing.component.html',
})
export class TransactionRoutingComponent implements OnInit {
  public loadTransactionDetails$ = this._formRendererService.transaction$.pipe(
    filter(transactionModel => !!transactionModel.id),
    this._loadingService.switchMapWithLoading(transactionModel => {
      return of(transactionModel).pipe(
        tap(model => {
          if (model.activeTasks.length) {
            this._router.navigate([], { queryParams: { resume: true }, relativeTo: this._route, replaceUrl: true });
          } else {
            this._router.navigate(['readonly'], { relativeTo: this._route, replaceUrl: true });
          }
        }),
      );
    }),
  );

  constructor(
    private readonly _formRendererService: FormRendererService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
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
}
