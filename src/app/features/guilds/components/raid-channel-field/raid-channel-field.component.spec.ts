import { TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';

import { RaidChannelFieldComponent } from './raid-channel-field.component';
import { DiscordChannel, DiscordChannelPermissionFlag } from '../../../../shared/models/discord-channel.model';
import { DiscordCategory } from '../../../../shared/models/discord-category.model';

registerLocaleData(localeEn, 'en');
registerLocaleData(localeFr, 'fr');

const channel = (overrides?: Partial<DiscordChannel>): DiscordChannel => ({
  id: '1',
  name: 'general',
  missingPermissions: [],
  categoryName: null,
  ...overrides,
});

const category = (overrides?: Partial<DiscordCategory>): DiscordCategory => ({
  id: 'cat-1',
  name: 'Raids',
  canCreateChannel: true,
  ...overrides,
});

describe('RaidChannelFieldComponent', () => {
  const setup = (overrides?: {
    channels?: DiscordChannel[];
    categories?: DiscordCategory[];
    canCreateRootChannel?: boolean;
    showNewChannelName?: boolean;
    raidName?: string;
    startsAtLocal?: string;
    guildLanguage?: string;
  }) => {
    TestBed.configureTestingModule({ imports: [RaidChannelFieldComponent] }).overrideComponent(RaidChannelFieldComponent, {
      set: { template: '', imports: [] },
    });

    const fixture = TestBed.createComponent(RaidChannelFieldComponent);
    fixture.componentRef.setInput('channels', overrides?.channels ?? []);
    fixture.componentRef.setInput('categories', overrides?.categories ?? []);
    fixture.componentRef.setInput('canCreateRootChannel', overrides?.canCreateRootChannel ?? true);
    fixture.componentRef.setInput('showNewChannelName', overrides?.showNewChannelName ?? true);
    fixture.componentRef.setInput('raidName', overrides?.raidName ?? '');
    fixture.componentRef.setInput('startsAtLocal', overrides?.startsAtLocal ?? '');
    fixture.componentRef.setInput('guildLanguage', overrides?.guildLanguage ?? 'en');
    fixture.componentRef.setInput('channelMode', 'existing');
    fixture.componentRef.setInput('selectedChannelId', null);
    fixture.componentRef.setInput('selectedCategoryId', null);
    fixture.componentRef.setInput('newChannelName', '');
    fixture.detectChanges();
    return fixture;
  };

  // ── channelOptions ────────────────────────────────────────────────────────

  describe('channelOptions', () => {
    it('marks a channel with missing permissions with a warning prefix', () => {
      const fixture = setup({ channels: [channel({ id: '1', name: 'mod-only', missingPermissions: [DiscordChannelPermissionFlag.EmbedLinks] })] });

      expect(fixture.componentInstance.channelOptions()).toEqual([{ value: '1', label: '⚠️ mod-only', group: undefined }]);
    });

    it('leaves a channel with no missing permissions unmarked', () => {
      const fixture = setup({ channels: [channel({ id: '1', name: 'general' })] });

      expect(fixture.componentInstance.channelOptions()).toEqual([{ value: '1', label: 'general', group: undefined }]);
    });

    it('sorts by category name then channel name', () => {
      const fixture = setup({
        channels: [
          channel({ id: '1', name: 'zeta', categoryName: 'Raids' }),
          channel({ id: '2', name: 'alpha', categoryName: 'Officers' }),
          channel({ id: '3', name: 'alpha', categoryName: 'Raids' }),
        ],
      });

      expect(fixture.componentInstance.channelOptions().map((o) => o.value)).toEqual(['2', '3', '1']);
    });

    it('sorts channels with no category (null categoryName) ahead of categorized ones', () => {
      const fixture = setup({
        channels: [
          channel({ id: '1', name: 'zeta', categoryName: 'Raids' }),
          channel({ id: '2', name: 'general', categoryName: null }),
        ],
      });

      expect(fixture.componentInstance.channelOptions().map((o) => o.value)).toEqual(['2', '1']);
    });

    it('sorts channels with no category ahead of categorized ones regardless of input order', () => {
      const fixture = setup({
        channels: [
          channel({ id: '1', name: 'general', categoryName: null }),
          channel({ id: '2', name: 'zeta', categoryName: 'Raids' }),
        ],
      });

      expect(fixture.componentInstance.channelOptions().map((o) => o.value)).toEqual(['1', '2']);
    });
  });

  // ── categoryOptions ───────────────────────────────────────────────────────

  describe('categoryOptions', () => {
    it('marks a category the bot cannot create channels in with a warning prefix', () => {
      const fixture = setup({ categories: [category({ id: 'cat-1', name: 'Officers', canCreateChannel: false })] });

      expect(fixture.componentInstance.categoryOptions()).toEqual([{ value: 'cat-1', label: '⚠️ Officers' }]);
    });

    it('leaves a category the bot can use unmarked', () => {
      const fixture = setup({ categories: [category({ id: 'cat-1', name: 'Raids', canCreateChannel: true })] });

      expect(fixture.componentInstance.categoryOptions()).toEqual([{ value: 'cat-1', label: 'Raids' }]);
    });
  });

  // ── canCreateAtSelection ──────────────────────────────────────────────────

  describe('canCreateAtSelection', () => {
    it('reflects canCreateRootChannel when no category is selected', () => {
      const fixture = setup({ canCreateRootChannel: false });

      expect(fixture.componentInstance.canCreateAtSelection()).toBe(false);
    });

    it("reflects the selected category's canCreateChannel flag", () => {
      const fixture = setup({ categories: [category({ id: 'cat-1', canCreateChannel: false })] });
      fixture.componentRef.setInput('selectedCategoryId', 'cat-1');
      fixture.detectChanges();

      expect(fixture.componentInstance.canCreateAtSelection()).toBe(false);
    });

    it('defaults to true for an unknown category id', () => {
      const fixture = setup({ categories: [] });
      fixture.componentRef.setInput('selectedCategoryId', 'ghost');
      fixture.detectChanges();

      expect(fixture.componentInstance.canCreateAtSelection()).toBe(true);
    });
  });

  // ── auto-suggested channel name ──────────────────────────────────────────

  describe('newChannelName auto-suggestion', () => {
    it('suggests a name built from raidName/startsAtLocal/guildLanguage when untouched', () => {
      const fixture = setup({ raidName: 'Kara', startsAtLocal: '2026-08-18T20:00', guildLanguage: 'en' });

      expect(fixture.componentInstance.newChannelName()).toBe('kara-tue-18-aug');
    });

    it('stops overwriting the field once the user types in it', () => {
      const fixture = setup({ raidName: 'Kara', startsAtLocal: '2026-08-18T20:00', guildLanguage: 'en' });

      fixture.componentInstance.onNewChannelNameInput('my-custom-name');
      fixture.detectChanges();
      fixture.componentRef.setInput('raidName', 'Different Name');
      fixture.detectChanges();

      expect(fixture.componentInstance.newChannelName()).toBe('my-custom-name');
    });

    it('never auto-fills when showNewChannelName is false', () => {
      const fixture = setup({ raidName: 'Kara', startsAtLocal: '2026-08-18T20:00', guildLanguage: 'en', showNewChannelName: false });

      expect(fixture.componentInstance.newChannelName()).toBe('');
    });
  });

  // ── canCreateAtSelectionChange output ────────────────────────────────────

  it('emits canCreateAtSelectionChange whenever the computed value changes', () => {
    const fixture = setup({ canCreateRootChannel: true });
    const emitted: boolean[] = [];
    fixture.componentInstance.canCreateAtSelectionChange.subscribe((v) => emitted.push(v));

    fixture.componentRef.setInput('canCreateRootChannel', false);
    fixture.detectChanges();

    expect(emitted).toContain(false);
  });
});
