import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { HomeComponent } from './features/home/home.component';
import { NoGuildComponent } from './features/no-guild/no-guild.component';
import { CharactersComponent } from './features/characters/characters.component';
import { SettingsComponent } from './features/settings/settings.component';
import { RegisterComponent } from './features/guilds/pages/register/register.component';
import { AuthCallbackComponent } from './core/components/auth-callback.component';
import { GuildCalendarComponent } from './features/guilds/pages/calendar/guild-calendar.component';
import { GuildDashboardComponent } from './features/guilds/pages/dashboard/guild-dashboard.component';
import { GuildListComponent } from './features/guilds/pages/list/guild-list.component';
import { GuildLootComponent } from './features/guilds/pages/loots/guild-loot.component';
import { GuildRosterComponent } from './features/guilds/pages/roster/guild-roster.component';
import { GuildSettingsComponent } from './features/guilds/pages/settings/guild-settings.component';
import { discordAdminGuard } from './features/guilds/guards/discord-admin-guard';
import { eligibleGuildGuard } from './features/guilds/guards/eligible-guild-guard';
import { guildAccessGuard } from './features/guilds/guards/guild-access-guard';
import { GuildLayoutComponent } from './features/guilds/layout/guild-layout.component';
import { PageLayoutComponent } from './shared/layout/page/page-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: PageLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'authcallback', component: AuthCallbackComponent },
      {
        path: '',
        canActivate: [authGuard],
        children: [
          { path: 'no-guild', component: NoGuildComponent },
          { path: 'characters', component: CharactersComponent },
          { path: 'settings', component: SettingsComponent },
          {
            path: '',
            canActivate: [eligibleGuildGuard],
            children: [
              { path: 'guilds', component: GuildListComponent },
              {
                path: 'guilds/:id',
                component: GuildLayoutComponent,
                canActivate: [guildAccessGuard],
                children: [
                  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
                  { path: 'dashboard', component: GuildDashboardComponent },
                  { path: 'calendar', component: GuildCalendarComponent },
                  { path: 'roster', component: GuildRosterComponent },
                  { path: 'loot', component: GuildLootComponent },
                  { path: 'settings', component: GuildSettingsComponent },
                ],
              },
              {
                path: 'register/:id',
                component: RegisterComponent,
                canActivate: [discordAdminGuard],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
