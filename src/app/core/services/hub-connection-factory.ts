import { InjectionToken } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

/**
 * Builds a SignalR connection for a given hub URL. Extracted behind a DI token (rather than
 * calling `HubConnectionBuilder` directly in each hub service) so unit tests can substitute a
 * fake connection via a TestBed provider override, the same way every other service in this
 * codebase is tested — instead of `vi.mock`-ing the `@microsoft/signalr` package itself, which
 * leaks across spec files under this repo's non-isolated Vitest runner. Shared by every hub
 * service (`AuthHubService`, `RaidSignupHubService`, ...) rather than one token per hub, since the
 * factory itself carries no hub-specific behavior.
 */
export const HUB_CONNECTION_FACTORY = new InjectionToken<(hubUrl: string) => HubConnection>(
  'HUB_CONNECTION_FACTORY',
  {
    providedIn: 'root',
    /* v8 ignore next 2 */
    factory: () => (hubUrl: string) =>
      new HubConnectionBuilder().withUrl(hubUrl, { withCredentials: true }).withAutomaticReconnect().build(),
  },
);
