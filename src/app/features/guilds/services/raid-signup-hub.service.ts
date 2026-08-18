import { inject, Service } from '@angular/core';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { HUB_CONNECTION_FACTORY } from '../../../core/services/hub-connection-factory';

/**
 * Thin wrapper around the `/hubs/raid-signup` SignalR connection. Unlike `AuthHubService` (one
 * implicit per-user target via the JWT `sub` claim), a raid event's push scope isn't derivable
 * from the token, so the client explicitly joins/leaves a group per event it's displaying — see
 * `RaidSignupHub.JoinRaidEvent`/`LeaveRaidEvent`. One shared connection serves every raid panel
 * on the page at once (up to `MAX_VISIBLE_EVENTS` in `RaidsComponent`), each joining its own
 * event's group independently; `onRaidSignupChanged` pushes the changed event's ID so each
 * `RaidSignupListComponent` instance can tell whether the push is actually about *its* event.
 */
@Service()
export class RaidSignupHubService {
  readonly #createConnection = inject(HUB_CONNECTION_FACTORY);

  #connection: HubConnection | null = null;
  #ready: Promise<HubConnection> | null = null;

  #connect(): Promise<HubConnection> {
    if (this.#connection?.state === HubConnectionState.Connected) return Promise.resolve(this.#connection);
    if (this.#ready) return this.#ready;

    const hubUrl = `${environment.apiUrl.replace(/\/api\/v1$/, '')}/hubs/raid-signup`;
    const connection = this.#createConnection(hubUrl);
    this.#connection = connection;
    this.#ready = connection
      .start()
      .then(() => connection)
      .catch((err: unknown) => {
        if (this.#connection === connection) this.#connection = null;
        this.#ready = null;
        throw err;
      });
    return this.#ready;
  }

  /** Joins the push group for one raid event's signup changes — safe to call for several events concurrently over the same connection. */
  async joinEvent(guildId: string, guildBranchId: number, eventId: number): Promise<void> {
    const connection = await this.#connect();
    await connection.invoke('JoinRaidEvent', guildId, guildBranchId, eventId);
  }

  /** Leaves the push group — best-effort, since the connection may already be gone by the time a component tears down (e.g. tab closed). */
  leaveEvent(guildBranchId: number, eventId: number): void {
    if (this.#connection?.state !== HubConnectionState.Connected) return;
    this.#connection.invoke('LeaveRaidEvent', guildBranchId, eventId).catch(() => {});
  }

  /**
   * Registers a callback fired with the changed event's ID on every `RaidSignupChanged` push —
   * callers filter to their own event themselves, since several raid panels share this one
   * connection. Returns an unsubscribe function.
   */
  onRaidSignupChanged(callback: (eventId: number) => void): () => void {
    this.#connect()
      .then((connection) => connection.on('RaidSignupChanged', callback))
      .catch(() => {
        // Best-effort live updates only — the panel already refreshes on the next board reload.
      });
    return () => this.#connection?.off('RaidSignupChanged', callback);
  }
}
