import { NgModule } from '@angular/core';
import { Router } from '@angular/router';
import { MockService } from 'ng-mocks';
import { Observable, of, switchMap } from 'rxjs';
import { LoadingService } from './loading.service';

export const MockLoadingService = {
  loading$: of(false),
  observableWithLoading$: <T>(observable$: Observable<T>): Observable<T> => {
    return observable$;
  },
  switchMapWithLoading: (projectionFn: (value: unknown, index: number) => Observable<unknown>) => (source$: Observable<unknown>) =>
    source$.pipe(switchMap(projectionFn)),
  withLoading: <T>() => {
    return (source$: Observable<T>) => {
      return source$;
    };
  },
};
@NgModule({
  exports: [],
  imports: [],
  providers: [
    { provide: Router, useValue: MockService(Router) },
    {
      provide: LoadingService,
      useValue: MockLoadingService,
    },
  ],
})
export class LoadingTestingModule {}
