import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormRendererService } from '@dsg/shared/feature/form-nuv';
import { LoadingService, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { filter, of } from 'rxjs';
import { DashboardService } from '../../services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  selector: 'dsg-employer-sub-category',
  standalone: true,
  styleUrls: ['./employer-sub-category.component.scss'],
  templateUrl: './employer-sub-category.component.html',
})
export class EmployerSubCategoryComponent {
  public subCategoryRoute = '';

  public loadTransactionDetails$ = this._formRendererService.transaction$.pipe(filter(transactionModel => !!transactionModel.id));

  constructor(
    private readonly _formRendererService: FormRendererService,
    private readonly _route: ActivatedRoute,
    private readonly _dashboardService: DashboardService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _loadingService: LoadingService,
  ) {}

  public loadSubCategory$ = this._route.paramMap.pipe(
    this._loadingService.switchMapWithLoading(params => {
      this.subCategoryRoute = params.get('subCategory') ?? this._route.snapshot?.url[0]?.path ?? '';

      const subCategories = this._dashboardService.getCurrentDashboardSubCategories();
      const subCategory = subCategories.find(tab => tab.key === this.subCategoryRoute);

      if (!subCategory) {
        if (this.subCategoryRoute !== '') {
          this._nuverialSnackBarService.notifyApplicationError();
        }

        return of(subCategories[0]);
      }

      return of(subCategory);
    }),
  );
}
