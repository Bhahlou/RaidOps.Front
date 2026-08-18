import { inject, Service } from '@angular/core';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { HUB_CONNECTION_FACTORY } from './hub-connection-factory';

export { HUB_CONNECTION_FACTORY };

/**
 * Thin wrapper around the `/hubs/auth` SignalR connection. Holds no app state — pushes a
 * "Discord data changed" signal to whoever calls `start()`, so callers (AuthStore) decide what
 * to do with it (re-fetch `/user/me`).
 */
@Service()
export class AuthHubService {
  readonly #createConnection = inject(HUB_CONNECTION_FACTORY);

  #connection: HubConnection | null = null;

  /**
   * Opens the hub connection if not already open/opening, and invokes `onDiscordDataChanged`
   * whenever the server pushes a `DiscordDataChanged` event. No-op if already connected.
   */
  start(onDiscordDataChanged: () => void): void {
    if (this.#connection !== null) return;

    const hubUrl = `${environment.apiUrl.replace(/\/api\/v1$/, '')}/hubs/auth`;
    const connection = this.#createConnection(hubUrl);

    connection.on('DiscordDataChanged', onDiscordDataChanged);

    this.#connection = connection;
    connection.start().catch(() => {
      // Best-effort: the existing refresh-on-401 path still covers us if the live push never
      // connects (blocked WebSocket, network hiccup, expired access_token cookie — negotiate
      // isn't routed through HttpClient, so authInterceptor can't silently refresh it here).
      // Clear #connection so the next start() call (after AuthStore refreshes the cookie) can
      // actually retry instead of permanently no-op'ing on a connection that never opened.
      if (this.#connection === connection) {
        this.#connection = null;
      }
    });
  }

  /** Closes the hub connection, if open. */
  stop(): void {
    if (this.#connection === null) return;

    const connection = this.#connection;
    this.#connection = null;

    if (connection.state !== HubConnectionState.Disconnected) {
      connection.stop();
    }
  }
}
