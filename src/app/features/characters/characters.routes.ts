import { Routes } from '@angular/router';
import { charactersResolver } from './characters.resolver';

export const characterRoutes: Routes = [
  {
    path: '',
    resolve: { characters: charactersResolver },
    loadComponent: () =>
      import('./pages/list/list.component').then(m => m.CharacterListComponent),
  },
  {
    path: ':branch/:realm/:name',
    resolve: { characters: charactersResolver },
    loadComponent: () =>
      import('./pages/detail/character-detail.component').then(m => m.CharacterDetailComponent),
  },
];
