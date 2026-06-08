import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { BnetCallbackComponent } from './bnet-callback.component';

const makeRoute = (bnetLinked: string | null, error: string | null = null) => ({
  snapshot: {
    queryParamMap: {
      get: (key: string) => {
        if (key === 'bnet_linked') return bnetLinked;
        if (key === 'error') return error;
        return null;
      },
    },
  },
});

describe('BnetCallbackComponent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // Restore parent to self in case it was overridden for the iframe test
    try {
      Object.defineProperty(globalThis, 'parent', {
        value: globalThis.self,
        configurable: true,
        writable: true,
      });
    } catch {}
  });

  const setup = (route: ReturnType<typeof makeRoute>) => {
    TestBed.configureTestingModule({
      imports: [BnetCallbackComponent],
      providers: [{ provide: ActivatedRoute, useValue: route }],
    });
    return TestBed.createComponent(BnetCallbackComponent);
  };

  it('creates the component', () => {
    const fixture = setup(makeRoute('true'));
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('popup (opener) context', () => {
    it('posts success message to opener and closes the window', () => {
      const postMessage = vi.fn();
      vi.stubGlobal('opener', { postMessage });
      vi.stubGlobal('close', vi.fn());

      const fixture = setup(makeRoute('true'));
      fixture.detectChanges();

      expect(postMessage).toHaveBeenCalledWith(
        { type: 'bnet_oauth' },
        globalThis.location.origin,
      );
      expect((globalThis.close as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
    });

    it('posts error message when bnet_linked is not true', () => {
      const postMessage = vi.fn();
      vi.stubGlobal('opener', { postMessage });
      vi.stubGlobal('close', vi.fn());

      const fixture = setup(makeRoute(null, 'access_denied'));
      fixture.detectChanges();

      expect(postMessage).toHaveBeenCalledWith(
        { type: 'bnet_oauth', error: 'access_denied' },
        globalThis.location.origin,
      );
    });

    it('defaults error to "unknown" when error param is absent', () => {
      const postMessage = vi.fn();
      vi.stubGlobal('opener', { postMessage });
      vi.stubGlobal('close', vi.fn());

      const fixture = setup(makeRoute(null, null));
      fixture.detectChanges();

      expect(postMessage).toHaveBeenCalledWith(
        { type: 'bnet_oauth', error: 'unknown' },
        globalThis.location.origin,
      );
    });
  });

  describe('iframe context', () => {
    it('posts message to parent when loaded in a hidden iframe', () => {
      vi.stubGlobal('opener', null);

      const parentPostMessage = vi.fn();
      Object.defineProperty(globalThis, 'parent', {
        value: { postMessage: parentPostMessage },
        configurable: true,
        writable: true,
      });

      const fixture = setup(makeRoute('true'));
      fixture.detectChanges();

      expect(parentPostMessage).toHaveBeenCalledWith(
        { type: 'bnet_oauth' },
        globalThis.location.origin,
      );
    });
  });

  describe('top-level page (no context)', () => {
    it('does not throw when neither opener nor iframe context', () => {
      vi.stubGlobal('opener', null);
      // In jsdom default context, parent === self, so the iframe branch is skipped.

      const fixture = setup(makeRoute('true'));
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});
