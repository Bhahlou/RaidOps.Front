import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscordIconComponent } from './discord-icon.component';
import { DiscordIconType } from '../../models/discord-icon-type.enum';

describe('DiscordIconComponent', () => {
  let component: DiscordIconComponent;
  let fixture: ComponentFixture<DiscordIconComponent>;

  const setup = (id: string, type: DiscordIconType, hash?: string | null) => {
    fixture = TestBed.createComponent(DiscordIconComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', id);
    fixture.componentRef.setInput('type', type);
    if (hash !== undefined) fixture.componentRef.setInput('hash', hash);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DiscordIconComponent] });
  });

  it('should create', () => {
    setup('123456789', DiscordIconType.User);
    expect(component).toBeTruthy();
  });

  describe('url', () => {
    it('returns an avatar URL for a User with a hash', () => {
      setup('123456789', DiscordIconType.User, 'abc123');

      expect(component.url).toBe(
        'https://cdn.discordapp.com/avatars/123456789/abc123.png',
      );
    });

    it('returns an icon URL for a Guild with a hash', () => {
      setup('987654321', DiscordIconType.Guild, 'def456');

      expect(component.url).toBe(
        'https://cdn.discordapp.com/icons/987654321/def456.png',
      );
    });

    it('returns a fallback default avatar URL when hash is null', () => {
      // index = Number((BigInt('123456789') >> 22n) % 6n) = 5
      setup('123456789', DiscordIconType.User, null);

      expect(component.url).toBe(
        'https://cdn.discordapp.com/embed/avatars/5.png',
      );
    });

    it('returns a fallback default avatar URL when hash is not provided', () => {
      setup('123456789', DiscordIconType.User);

      expect(component.url).toBe(
        'https://cdn.discordapp.com/embed/avatars/5.png',
      );
    });
  });
});
