import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleThresholdPickerComponent } from './role-threshold-picker.component';
import { DiscordRole } from '../../../../shared/models/discord-role.model';

const role = (id: string, color = 0, iconHash: string | null = null): DiscordRole =>
  ({ id, name: `Role ${id}`, color, iconHash });

describe('RoleThresholdPickerComponent', () => {
  let fixture: ComponentFixture<RoleThresholdPickerComponent>;
  let component: RoleThresholdPickerComponent;

  const setup = (roles: DiscordRole[] = [], selectedRoleId: string | null = null) => {
    TestBed.configureTestingModule({
      imports: [RoleThresholdPickerComponent],
    }).overrideComponent(RoleThresholdPickerComponent, { set: { template: '', imports: [] } });

    fixture = TestBed.createComponent(RoleThresholdPickerComponent);
    fixture.componentRef.setInput('roles', roles);
    fixture.componentRef.setInput('value', selectedRoleId);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  // ── isIncluded ────────────────────────────────────────────────────────────

  describe('isIncluded', () => {
    it('returns true for roles at or before the threshold index', () => {
      setup([role('r1'), role('r2'), role('r3')], 'r2');

      expect(component.isIncluded(role('r1'))).toBe(true);
      expect(component.isIncluded(role('r2'))).toBe(true);
      expect(component.isIncluded(role('r3'))).toBe(false);
    });

    it('returns false when no threshold is set', () => {
      setup([role('r1')], null);

      expect(component.isIncluded(role('r1'))).toBe(false);
    });
  });

  // ── isThreshold ───────────────────────────────────────────────────────────

  describe('isThreshold', () => {
    it('returns true only for the current threshold role', () => {
      setup([role('r1'), role('r2'), role('r3')], 'r2');

      expect(component.isThreshold(role('r2'))).toBe(true);
      expect(component.isThreshold(role('r1'))).toBe(false);
      expect(component.isThreshold(role('r3'))).toBe(false);
    });
  });

  // ── isExcluded ────────────────────────────────────────────────────────────

  describe('isExcluded', () => {
    it('returns true for roles after the threshold index', () => {
      setup([role('r1'), role('r2'), role('r3')], 'r2');

      expect(component.isExcluded(role('r1'))).toBe(false);
      expect(component.isExcluded(role('r2'))).toBe(false);
      expect(component.isExcluded(role('r3'))).toBe(true);
    });

    it('returns false when no threshold is set', () => {
      setup([role('r1')], null);

      expect(component.isExcluded(role('r1'))).toBe(false);
    });
  });

  // ── select ────────────────────────────────────────────────────────────────

  describe('select', () => {
    it('sets the selected role id', () => {
      setup([role('r1')], null);

      component.select('r1');

      expect(component.value()).toBe('r1');
    });

    it('sets null when the same role is selected again (toggle off)', () => {
      setup([role('r1')], 'r1');

      component.select('r1');

      expect(component.value()).toBeNull();
    });
  });

  // ── roleColor ─────────────────────────────────────────────────────────────

  describe('roleColor', () => {
    it('returns a 6-digit lowercase hex string for a non-zero color', () => {
      setup();

      expect(component.roleColor(role('r1', 0xff0000))).toBe('#ff0000');
    });

    it('returns null for a zero color', () => {
      setup();

      expect(component.roleColor(role('r1', 0))).toBeNull();
    });
  });

  // ── roleIconUrl ───────────────────────────────────────────────────────────

  describe('roleIconUrl', () => {
    it('returns a Discord CDN URL containing the role id and icon hash', () => {
      setup();

      expect(component.roleIconUrl(role('r1', 0, 'abc123'))).toContain('/role-icons/r1/abc123');
    });

    it('returns null when iconHash is null', () => {
      setup();

      expect(component.roleIconUrl(role('r1', 0, null))).toBeNull();
    });
  });
});
