import { InjectionToken } from '@angular/core';

export const LOCATION = new InjectionToken<Pick<Location, 'assign'>>('LOCATION', {
  providedIn: 'root',
  factory: /* v8 ignore next */ () => globalThis.location,
});
