import { Routes } from '@angular/router';
import { discordAdminGuard } from './guards/discord-admin-guard';
import { eligibleGuildGuard } from './guards/eligible-guild-guard';
import { guildAccessGuard } from './guards/guild-access-guard';
import { charactersResolver } from '../characters/characters.resolver';

export const guildRoutes: Routes = [
  {
    path: 'no-guild',
    loadComponent: () =>
      import('./pages/no-guild/no-guild.component').then(m => m.NoGuildComponent),
  },
  {
    path: 'guild-register/:id',
    canActivate: [discordAdminGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [eligibleGuildGuard],
    children: [
      {
        path: 'guilds',
        loadComponent: () =>
          import('./pages/list/guild-list.component').then(m => m.GuildListComponent),
      },
      {
        path: 'guilds/:id',
        canActivate: [guildAccessGuard],
        loadComponent: () =>
          import('./layout/guild-layout.component').then(m => m.GuildLayoutComponent),
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/dashboard/guild-dashboard.component').then(m => m.GuildDashboardComponent),
          },
          {
            path: 'calendar',
            loadComponent: () =>
              import('./pages/calendar/guild-calendar.component').then(m => m.GuildCalendarComponent),
          },
          {
            path: 'roster',
            resolve: { characters: charactersResolver },
            loadComponent: () =>
              import('./pages/roster/guild-roster.component').then(m => m.GuildRosterComponent),
          },
          {
            path: 'loot',
            loadComponent: () =>
              import('./pages/loots/guild-loot.component').then(m => m.GuildLootComponent),
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./pages/settings/guild-settings.component').then(m => m.GuildSettingsComponent),
          },
        ],
      },
    ],
  },
];
