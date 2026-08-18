import { TestBed } from '@angular/core/testing';
import { HubConnectionState } from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { HUB_CONNECTION_FACTORY } from '../../../core/services/hub-connection-factory';
import { RaidSignupHubService } from './raid-signup-hub.service';

const expectedHubUrl = `${environment.apiUrl.replace(/\/api\/v1$/, '')}/hubs/raid-signup`;

describe('RaidSignupHubService', () => {
  let service: RaidSignupHubService;
  let mockConnection: {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
    invoke: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    state: HubConnectionState;
  };
  let createConnection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConnection = {
      on: vi.fn(),
      off: vi.fn(),
      invoke: vi.fn().mockResolvedValue(undefined),
      start: vi.fn().mockResolvedValue(undefined),
      state: HubConnectionState.Connected,
    };
    createConnection = vi.fn().mockReturnValue(mockConnection);

    TestBed.configureTestingModule({
      providers: [{ provide: HUB_CONNECTION_FACTORY, useValue: createConnection }],
    });
    service = TestBed.inject(RaidSignupHubService);
  });

  // ── joinEvent ─────────────────────────────────────────────────────────────

  describe('joinEvent', () => {
    it('builds the connection against the /hubs/raid-signup URL and starts it', async () => {
      await service.joinEvent('g1', 10, 5);

      expect(createConnection).toHaveBeenCalledWith(expectedHubUrl);
      expect(mockConnection.start).toHaveBeenCalledOnce();
    });

    it('invokes JoinRaidEvent with the guild/branch/event ids', async () => {
      await service.joinEvent('g1', 10, 5);

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRaidEvent', 'g1', 10, 5);
    });

    it('reuses the same connection for a second call', async () => {
      await service.joinEvent('g1', 10, 5);
      await service.joinEvent('g1', 10, 6);

      expect(createConnection).toHaveBeenCalledOnce();
      expect(mockConnection.start).toHaveBeenCalledOnce();
    });

    it('reuses an in-flight connection attempt instead of starting a second one', async () => {
      // Mirrors a real HubConnection, which isn't Connected until start() resolves — otherwise
      // the second call would short-circuit on the "already connected" check instead of actually
      // exercising the in-flight #ready reuse path.
      mockConnection.state = HubConnectionState.Connecting;

      const first = service.joinEvent('g1', 10, 5);
      const second = service.joinEvent('g1', 10, 6);
      await Promise.all([first, second]);

      expect(createConnection).toHaveBeenCalledOnce();
      expect(mockConnection.start).toHaveBeenCalledOnce();
    });

    it('starts a fresh connection if start() previously failed', async () => {
      const rejection = Promise.reject(new Error('negotiate failed'));
      mockConnection.start.mockReturnValue(rejection);

      await service.joinEvent('g1', 10, 5).catch(() => {});
      await service.joinEvent('g1', 10, 5).catch(() => {});

      expect(createConnection).toHaveBeenCalledTimes(2);
    });

    it('propagates a start() rejection to the caller', async () => {
      mockConnection.start.mockReturnValue(Promise.reject(new Error('negotiate failed')));

      await expect(service.joinEvent('g1', 10, 5)).rejects.toThrow('negotiate failed');
    });

    it('does not rebuild the connection when already connected', async () => {
      await service.joinEvent('g1', 10, 5);
      mockConnection.state = HubConnectionState.Connected;

      await service.joinEvent('g1', 10, 6);

      expect(createConnection).toHaveBeenCalledOnce();
    });
  });

  // ── leaveEvent ────────────────────────────────────────────────────────────

  describe('leaveEvent', () => {
    it('is a no-op when no connection was ever started', () => {
      service.leaveEvent(10, 5);

      expect(mockConnection.invoke).not.toHaveBeenCalled();
    });

    it('is a no-op when the connection is not currently connected', async () => {
      await service.joinEvent('g1', 10, 5);
      mockConnection.state = HubConnectionState.Disconnected;

      service.leaveEvent(10, 5);

      expect(mockConnection.invoke).toHaveBeenCalledWith('JoinRaidEvent', 'g1', 10, 5);
      expect(mockConnection.invoke).not.toHaveBeenCalledWith('LeaveRaidEvent', 10, 5);
    });

    it('invokes LeaveRaidEvent when connected', async () => {
      await service.joinEvent('g1', 10, 5);

      service.leaveEvent(10, 5);

      expect(mockConnection.invoke).toHaveBeenCalledWith('LeaveRaidEvent', 10, 5);
    });

    it('swallows a rejected LeaveRaidEvent invoke (best-effort)', async () => {
      await service.joinEvent('g1', 10, 5);
      mockConnection.invoke.mockReturnValue(Promise.reject(new Error('gone')));

      expect(() => service.leaveEvent(10, 5)).not.toThrow();
    });
  });

  // ── onRaidSignupChanged ───────────────────────────────────────────────────

  describe('onRaidSignupChanged', () => {
    it('registers the callback for the RaidSignupChanged event once connected', async () => {
      const callback = vi.fn();

      service.onRaidSignupChanged(callback);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(mockConnection.on).toHaveBeenCalledWith('RaidSignupChanged', callback);
    });

    it('builds the connection if none exists yet', () => {
      service.onRaidSignupChanged(vi.fn());

      expect(createConnection).toHaveBeenCalledWith(expectedHubUrl);
    });

    it('does not throw when the connection fails to start', async () => {
      mockConnection.start.mockReturnValue(Promise.reject(new Error('negotiate failed')));

      expect(() => service.onRaidSignupChanged(vi.fn())).not.toThrow();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it('returns an unsubscribe function that turns off the callback', async () => {
      const callback = vi.fn();
      const unsubscribe = service.onRaidSignupChanged(callback);
      await Promise.resolve();
      await Promise.resolve();

      unsubscribe();

      expect(mockConnection.off).toHaveBeenCalledWith('RaidSignupChanged', callback);
    });

    it('unsubscribe is a no-op if no connection was ever established', () => {
      mockConnection.start.mockReturnValue(Promise.reject(new Error('negotiate failed')));
      const unsubscribe = service.onRaidSignupChanged(vi.fn());

      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
