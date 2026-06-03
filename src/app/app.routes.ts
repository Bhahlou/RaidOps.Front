import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { PageLayoutComponent } from './shared/layout/page/page-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PageLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'authcallback',
        loadComponent: () =>
          import('./core/components/auth-callback.component').then(m => m.AuthCallbackComponent),
      },
      {
        path: 'bnet-callback',
        loadComponent: () =>
          import('./core/components/bnet-callback.component').then(m => m.BnetCallbackComponent),
      },
      {
        path: '',
        canActivate: [authGuard],
        children: [
          {
            path: 'characters',
            loadChildren: () =>
              import('./features/characters/characters.routes').then(m => m.characterRoutes),
          },
          {
            path: 'gear-planner',
            loadComponent: () =>
              import('./features/gear-planner/gear-planner.component').then(m => m.GearPlannerComponent),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/settings/settings.component').then(m => m.SettingsComponent),
          },
          {
            path: '',
            loadChildren: () =>
              import('./features/guilds/guilds.routes').then(m => m.guildRoutes),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
