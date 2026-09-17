import { TestBed } from '@angular/core/testing';

import { BLANK_ICON_SOURCE, IconSourcePickerComponent, IconSourceState } from './icon-source-picker.component';
import { AttributionIconSource } from '../../models/attribution-icon-source.enum';
import { RaidMarkerIcon } from '../../models/raid-marker-icon.enum';
import { SpecRole } from '../../../../../shared/models/spec-role.enum';
import { Spell } from '../../models/spell.model';

describe('IconSourcePickerComponent', () => {
  const setup = (value: IconSourceState = BLANK_ICON_SOURCE) => {
    TestBed.configureTestingModule({ imports: [IconSourcePickerComponent] }).overrideComponent(IconSourcePickerComponent, {
      set: { template: '', imports: [] },
    });

    const fixture = TestBed.createComponent(IconSourcePickerComponent);
    fixture.componentRef.setInput('guildId', 'guild-1');
    fixture.componentRef.setInput('expansionId', 2);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('onMarkerSelected', () => {
    it('emits a RaidMarker state with every other field cleared', () => {
      const component = setup();
      const spy = vi.fn();
      component.changed.subscribe(spy);

      component.onMarkerSelected(RaidMarkerIcon.Skull);

      expect(spy).toHaveBeenCalledWith({ iconSource: AttributionIconSource.RaidMarker, raidMarker: RaidMarkerIcon.Skull, spellId: null, spellIconUrl: null, staticRole: null });
    });
  });

  describe('onStaticRoleSelected', () => {
    it('emits a StaticRole state with every other field cleared', () => {
      const component = setup();
      const spy = vi.fn();
      component.changed.subscribe(spy);

      component.onStaticRoleSelected(SpecRole.Tank);

      expect(spy).toHaveBeenCalledWith({ iconSource: AttributionIconSource.StaticRole, staticRole: SpecRole.Tank, spellId: null, spellIconUrl: null, raidMarker: null });
    });
  });

  describe('onSpellSelected', () => {
    it('emits a Spell state carrying the spell id and icon URL, with every other field cleared', () => {
      const component = setup();
      const spy = vi.fn();
      component.changed.subscribe(spy);
      const spell: Spell = { id: 5, name: 'Innervate', iconUrl: 'https://cdn/innervate.jpg' };

      component.onSpellSelected(spell);

      expect(spy).toHaveBeenCalledWith({ iconSource: AttributionIconSource.Spell, spellId: 5, spellIconUrl: 'https://cdn/innervate.jpg', raidMarker: null, staticRole: null });
    });
  });

  describe('clear', () => {
    it('emits the blank icon source state', () => {
      const component = setup({ iconSource: AttributionIconSource.RaidMarker, raidMarker: RaidMarkerIcon.Skull, spellId: null, spellIconUrl: null, staticRole: null });
      const spy = vi.fn();
      component.changed.subscribe(spy);

      component.clear();

      expect(spy).toHaveBeenCalledWith(BLANK_ICON_SOURCE);
    });
  });
});
