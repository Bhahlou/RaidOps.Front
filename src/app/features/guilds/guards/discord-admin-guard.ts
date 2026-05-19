import { CanActivateFn } from '@angular/router';

export const discordAdminGuard: CanActivateFn = (route, state) => {
  return true;
};
