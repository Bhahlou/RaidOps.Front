import { CanActivateFn } from '@angular/router';

export const eligibleGuildGuard: CanActivateFn = (route, state) => {
  return true;
};
