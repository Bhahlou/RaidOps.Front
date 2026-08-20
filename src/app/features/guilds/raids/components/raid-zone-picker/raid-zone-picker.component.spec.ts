import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RaidZonePickerComponent } from './raid-zone-picker.component';
import { RaidZone } from '../../models/raid-zone.model';

const zone = (overrides?: Partial<RaidZone>): RaidZone => ({
  id: 10,
  name: 'Serpentshrine Cavern',
  shortCode: 'SSC',
  iconUrl: null,
  groupCount: 5,
  slotsPerGroup: 5,
  sortOrder: 1,
  ...overrides,
});

describe('RaidZonePickerComponent', () => {
  let fixture: ComponentFixture<RaidZonePickerComponent>;
  let component: RaidZonePickerComponent;

  const setup = (zones: RaidZone[], selected: Set<number>, disabled = false) => {
    TestBed.configureTestingModule({
      imports: [RaidZonePickerComponent],
    }).overrideComponent(RaidZonePickerComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RaidZonePickerComponent);
    fixture.componentRef.setInput('zones', zones);
    fixture.componentRef.setInput('selectedZoneIds', selected);
    fixture.componentRef.setInput('disabled', disabled);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  };

  // ── isSelected ───────────────────────────────────────────────────────────

  describe('isSelected', () => {
    it('is true for a zone id in the selection', () => {
      setup([zone()], new Set([10]));
      expect(component.isSelected(10)).toBe(true);
    });

    it('is false for a zone id not in the selection', () => {
      setup([zone()], new Set());
      expect(component.isSelected(10)).toBe(false);
    });
  });

  // ── toggle ───────────────────────────────────────────────────────────────

  describe('toggle', () => {
    it('adds an unselected zone to the selection', () => {
      setup([zone()], new Set());
      component.toggle(10);
      expect(component.selectedZoneIds()).toEqual(new Set([10]));
    });

    it('removes an already-selected zone', () => {
      setup([zone()], new Set([10]));
      component.toggle(10);
      expect(component.selectedZoneIds()).toEqual(new Set());
    });

    it('does nothing when disabled', () => {
      setup([zone()], new Set(), true);
      component.toggle(10);
      expect(component.selectedZoneIds()).toEqual(new Set());
    });
  });

  // ── iconUrl ──────────────────────────────────────────────────────────────

  describe('iconUrl', () => {
    it('resolves the icon for a known short code', () => {
      setup([zone()], new Set());
      expect(component.iconUrl(zone({ shortCode: 'SSC' }))).toBe('/assets/images/raid-icons/ssc.jpg');
    });

    it('returns null for an unknown short code', () => {
      setup([zone()], new Set());
      expect(component.iconUrl(zone({ shortCode: 'Naxx' }))).toBeNull();
    });
  });
});
