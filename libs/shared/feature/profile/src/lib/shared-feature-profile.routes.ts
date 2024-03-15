import { Route } from '@angular/router';

export const sharedFeatureProfileRoutes: Route[] = [
  {
    loadComponent: () => import('./components/profile').then(c => c.ProfileComponent),
    path: '',
  },
  { path: '', pathMatch: 'full', redirectTo: '' },
  { path: '**', redirectTo: '' },
];
