import { TestBed } from '@angular/core/testing';

import { CharacterGearComponent } from './character-gear.component';

describe('CharacterGearComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [CharacterGearComponent] })
      .overrideComponent(CharacterGearComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(CharacterGearComponent);
    fixture.componentRef.setInput('characterId', 1);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });
});
