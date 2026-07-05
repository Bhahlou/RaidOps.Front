import { Routes } from '@angular/router';

export const manualRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/manual-layout.component').then(m => m.ManualLayoutComponent),
    children: [
      { path: '', redirectTo: 'getting-started/create-character', pathMatch: 'full' },
      {
        path: ':categoryId/:articleId',
        loadComponent: () =>
          import('./components/manual-article/manual-article.component').then(m => m.ManualArticleComponent),
      },
    ],
  },
];
