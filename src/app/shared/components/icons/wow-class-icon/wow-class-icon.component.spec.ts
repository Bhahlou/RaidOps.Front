import { TestBed } from '@angular/core/testing';

import { WowClassIconComponent } from './wow-class-icon.component';

describe('WowClassIconComponent', () => {
  const setup = (classId: number) => {
    TestBed.configureTestingModule({ imports: [WowClassIconComponent] });
    const fixture = TestBed.createComponent(WowClassIconComponent);
    fixture.componentRef.setInput('classId', classId);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup(1)).toBeTruthy();
  });

  describe('iconUrl', () => {
    it.each([
      [1,  'warrior'],
      [2,  'paladin'],
      [3,  'hunter'],
      [4,  'rogue'],
      [5,  'priest'],
      [6,  'deathknight'],
      [7,  'shaman'],
      [8,  'mage'],
      [9,  'warlock'],
      [10, 'monk'],
      [11, 'druid'],
      [12, 'demonhunter'],
      [13, 'evoker'],
    ])('classId %i → %s icon URL', (classId, slug) => {
      const component = setup(classId);
      expect(component.iconUrl).toBe(
        `https://render.worldofwarcraft.com/us/icons/56/classicon_${slug}.jpg`,
      );
    });

    it('returns an empty string for an unknown class id', () => {
      const component = setup(99);
      expect(component.iconUrl).toBe('');
    });
  });
});
