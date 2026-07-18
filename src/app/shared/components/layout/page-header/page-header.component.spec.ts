import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { By } from '@angular/platform-browser';

import { PageHeaderComponent, BreadcrumbItem, ManualLink } from './page-header.component';
import { DiscordIconType } from '../../../models/discord-icon-type.enum';

const setup = (items: BreadcrumbItem[], manualLink?: ManualLink): ComponentFixture<PageHeaderComponent> => {
  TestBed.configureTestingModule({
    imports: [
      PageHeaderComponent,
      TranslocoTestingModule.forRoot({
        langs: { en: {} },
        translocoConfig: { defaultLang: 'en', availableLangs: ['en'] },
      }),
    ],
    providers: [provideRouter([])],
  });
  const fixture = TestBed.createComponent(PageHeaderComponent);
  fixture.componentRef.setInput('items', items);
  if (manualLink) fixture.componentRef.setInput('manualLink', manualLink);
  fixture.detectChanges();
  return fixture;
};

describe('PageHeaderComponent', () => {
  it('should create', () => {
    expect(setup([{ label: 'Home' }]).componentInstance).toBeTruthy();
  });

  // ── label rendering ───────────────────────────────────────────────────────

  describe('label rendering', () => {
    it('displays the label text when no i18nKey is provided', () => {
      const fixture = setup([{ label: 'My Guild' }]);
      expect(fixture.nativeElement.textContent).toContain('My Guild');
    });

    it('displays the i18nKey itself via transloco when i18nKey is provided', () => {
      const fixture = setup([{ i18nKey: 'sidenav.guild.roster' }]);
      expect(fixture.nativeElement.textContent).toContain('sidenav.guild.roster');
    });
  });

  // ── current item ──────────────────────────────────────────────────────────

  describe('breadcrumb-item--current', () => {
    it('marks only the last item as current', () => {
      const fixture = setup([
        { label: 'Parent', link: ['/parent'] },
        { label: 'Current' },
      ]);
      const items = fixture.debugElement.queryAll(By.css('.breadcrumb-item'));

      expect(items[0].classes['breadcrumb-item--current']).toBeFalsy();
      expect(items[1].classes['breadcrumb-item--current']).toBe(true);
    });

    it('marks the single item as current when there is only one', () => {
      const fixture = setup([{ label: 'Only' }]);
      const item = fixture.debugElement.query(By.css('.breadcrumb-item'));

      expect(item.classes['breadcrumb-item--current']).toBe(true);
    });
  });

  // ── link rendering ────────────────────────────────────────────────────────

  describe('link rendering', () => {
    it('renders an <a> for a non-last item with a link', () => {
      const fixture = setup([
        { label: 'Parent', link: ['/parent'] },
        { label: 'Current' },
      ]);
      const anchor = fixture.debugElement.query(By.css('a.breadcrumb-label--link'));

      expect(anchor).toBeTruthy();
      expect(anchor.nativeElement.tagName).toBe('A');
    });

    it('renders a <span> for the last item even when link is provided', () => {
      const fixture = setup([{ label: 'Current', link: ['/current'] }]);
      const span = fixture.debugElement.query(By.css('span.breadcrumb-label'));

      expect(span).toBeTruthy();
    });

    it('renders a <span> for non-last items without a link', () => {
      const fixture = setup([
        { label: 'Parent' },
        { label: 'Current' },
      ]);
      const links = fixture.debugElement.queryAll(By.css('a.breadcrumb-label--link'));

      expect(links.length).toBe(0);
    });
  });

  // ── separators ────────────────────────────────────────────────────────────

  describe('separators', () => {
    it('renders n-1 separators for n items', () => {
      const fixture = setup([
        { label: 'A', link: ['/a'] },
        { label: 'B', link: ['/b'] },
        { label: 'C' },
      ]);
      const seps = fixture.debugElement.queryAll(By.css('.breadcrumb-sep'));

      expect(seps.length).toBe(2);
    });

    it('renders no separators for a single item', () => {
      const fixture = setup([{ label: 'Only' }]);
      const seps = fixture.debugElement.queryAll(By.css('.breadcrumb-sep'));

      expect(seps.length).toBe(0);
    });
  });

  // ── discord icon ──────────────────────────────────────────────────────────

  describe('discord icon', () => {
    it('renders app-discord-icon when discordIcon is provided', () => {
      const fixture = setup([
        { label: 'Guild', discordIcon: { id: 'g1', hash: 'abc', type: DiscordIconType.Guild } },
      ]);
      const icon = fixture.debugElement.query(By.css('app-discord-icon'));

      expect(icon).toBeTruthy();
    });

    it('does not render app-discord-icon when discordIcon is absent', () => {
      const fixture = setup([{ label: 'No Icon' }]);
      const icon = fixture.debugElement.query(By.css('app-discord-icon'));

      expect(icon).toBeNull();
    });
  });

  // ── manual help link ──────────────────────────────────────────────────────

  describe('manual help link', () => {
    it('renders app-manual-help-link next to the last item when manualLink is provided', () => {
      const fixture = setup(
        [{ label: 'Parent', link: ['/parent'] }, { label: 'Current' }],
        { category: 'guild', article: 'roster' },
      );
      const link = fixture.debugElement.query(By.css('app-manual-help-link'));

      expect(link).toBeTruthy();
    });

    it('does not render app-manual-help-link when manualLink is absent', () => {
      const fixture = setup([{ label: 'Current' }]);
      const link = fixture.debugElement.query(By.css('app-manual-help-link'));

      expect(link).toBeNull();
    });
  });
});
