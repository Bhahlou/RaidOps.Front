import { TestBed } from '@angular/core/testing';

import { WowFactionIconComponent } from './wow-faction-icon.component';

describe('WowFactionIconComponent', () => {
  const setup = (faction: string) => {
    TestBed.configureTestingModule({ imports: [WowFactionIconComponent] });
    const fixture = TestBed.createComponent(WowFactionIconComponent);
    fixture.componentRef.setInput('faction', faction);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup('ALLIANCE')).toBeTruthy();
  });

  describe('iconUrl', () => {
    it('returns the Alliance icon URL', () => {
      expect(setup('ALLIANCE').iconUrl).toContain('Alliance_64');
    });

    it('returns the Horde icon URL', () => {
      expect(setup('HORDE').iconUrl).toContain('Horde_64');
    });

    it('is case-insensitive (alliance)', () => {
      expect(setup('alliance').iconUrl).toContain('Alliance_64');
    });

    it('is case-insensitive (horde)', () => {
      expect(setup('horde').iconUrl).toContain('Horde_64');
    });

    it('returns an empty string for an unknown faction', () => {
      expect(setup('NEUTRAL').iconUrl).toBe('');
    });
  });
});
