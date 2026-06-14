import { TestBed } from '@angular/core/testing';

import { CharacterBisListComponent } from './character-bis-list.component';

describe('CharacterBisListComponent', () => {
  const setup = () => {
    TestBed.configureTestingModule({ imports: [CharacterBisListComponent] })
      .overrideComponent(CharacterBisListComponent, { set: { template: '', imports: [] } });

    const fixture = TestBed.createComponent(CharacterBisListComponent);
    fixture.componentRef.setInput('characterId', 1);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });
});
