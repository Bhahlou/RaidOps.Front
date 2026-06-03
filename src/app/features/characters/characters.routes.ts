import { Routes } from '@angular/router';

export const characterRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/list/list.component').then(m => m.CharacterListComponent),
  },
  {
    path: ':branch/:realm/:name',
    loadComponent: () =>
      import('./pages/detail/character-detail.component').then(m => m.CharacterDetailComponent),
  },
];
