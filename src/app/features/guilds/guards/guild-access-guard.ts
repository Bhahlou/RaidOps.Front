import { CanActivateFn } from '@angular/router';

export const guildAccessGuard: CanActivateFn = (route, state) => {
  return true;
};
