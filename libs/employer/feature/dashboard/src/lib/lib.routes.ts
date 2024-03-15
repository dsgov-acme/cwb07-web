/* eslint-disable sort-keys */
import { Route } from '@angular/router';
import { CanDeactivateStepperGuard } from '@dsg/shared/ui/nuverial';
import { UnderConstructionComponent } from './components/under-construction/under-construction.component';

const TransactionDetailsChildren = [
  {
    path: '',
    loadComponent: () => import('./components/transaction-routing').then(module => module.TransactionRoutingComponent),
    children: [
      { canDeactivate: [CanDeactivateStepperGuard], path: '', loadComponent: () => import('./components/intake').then(module => module.IntakeFormComponent) },
      { path: 'readonly', loadComponent: () => import('./components/readonly').then(module => module.ReadonlyComponent) },
      { path: 'submitted', loadComponent: () => import('./components/confirmation').then(module => module.ConfirmationComponent) },
    ],
  },
];

const EmployerTransactionChildren = [
  {
    path: '',
    children: [
      {
        path: 'details',
        loadComponent: () => import('./components/employer-sub-category').then(module => module.EmployerSubCategoryComponent),
        children: TransactionDetailsChildren,
      },
      {
        path: 'messages',
        loadComponent: () => import('./components/transaction-messages').then(module => module.TransactionMessagesComponent),
        children: [
          {
            loadComponent: () => import('@dsg/shared/feature/messaging').then(module => module.MessagesComponent),
            path: '',
          },
          {
            loadComponent: () => import('@dsg/shared/feature/messaging').then(module => module.NewConversationComponent),
            path: 'new-message',
          },
          {
            loadComponent: () => import('@dsg/shared/feature/messaging').then(module => module.ConversationComponent),
            path: 'conversation/:conversationId',
          },
        ],
      },
      {
        path: ':subCategory',
        loadComponent: () => import('./components/employer-sub-category').then(module => module.EmployerSubCategoryComponent),
        children: [{ path: '', component: UnderConstructionComponent }],
      },
    ],
  },
];

export const employerFeatureDashboardRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard').then(module => module.DashboardComponent),
  },
  {
    path: ':category/transaction/:transactionId',
    loadComponent: () => import('./components/employer-detail').then(module => module.EmployerDetailComponent),
    children: EmployerTransactionChildren,
  },
  {
    path: ':category',
    loadComponent: () => import('./components/category-routing').then(module => module.CategoryRoutingComponent),
    children: [
      {
        path: 'transactions',
        loadComponent: () => import('./components/transactions-dashboard').then(module => module.TransactionsDashboardComponent),
      },
      {
        path: '',
        loadComponent: () => import('./components/employer-detail').then(module => module.EmployerDetailComponent),
        children: [
          {
            path: 'manage-users',
            loadComponent: () => import('./components/employer-sub-category').then(module => module.EmployerSubCategoryComponent),
            children: [{ path: '', loadComponent: () => import('./components/account-access').then(module => module.ManageUsersComponent) }],
          },
          {
            path: 'activity-log',
            loadComponent: () => import('./components/account-access').then(module => module.AccountAccessEventsComponent),
          },
          {
            path: ':subCategory',
            loadComponent: () => import('./components/employer-sub-category').then(module => module.EmployerSubCategoryComponent),
            children: [{ path: '', component: UnderConstructionComponent }],
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
