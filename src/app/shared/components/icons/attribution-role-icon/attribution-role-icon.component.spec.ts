import { TestBed } from '@angular/core/testing';

import { AttributionRoleIconComponent } from './attribution-role-icon.component';
import { SpecRole } from '../../../models/spec-role.enum';

describe('AttributionRoleIconComponent', () => {
  const setup = (role: SpecRole, size?: number) => {
    TestBed.configureTestingModule({ imports: [AttributionRoleIconComponent] });
    const fixture = TestBed.createComponent(AttributionRoleIconComponent);
    fixture.componentRef.setInput('role', role);
    if (size !== undefined) fixture.componentRef.setInput('size', size);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    expect(setup(SpecRole.Tank)).toBeTruthy();
  });

  describe('iconUrl', () => {
    it('resolves the role icon asset URL', () => {
      expect(setup(SpecRole.Healer).componentInstance.iconUrl()).toBe('/assets/images/role-icons/healer.svg');
    });
  });

  it('renders an img with the resolved src and the given size', () => {
    const fixture = setup(SpecRole.MeleeDps, 32);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toContain('/assets/images/role-icons/mdps.svg');
    expect(img.style.width).toBe('32px');
    expect(img.style.height).toBe('32px');
  });

  it('defaults to a 24px size', () => {
    const fixture = setup(SpecRole.RangedDps);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.style.width).toBe('24px');
  });
});
