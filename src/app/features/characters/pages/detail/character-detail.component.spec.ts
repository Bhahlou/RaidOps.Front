import { TestBed } from '@angular/core/testing';

import { CharacterDetailComponent } from './character-detail.component';

describe('CharacterDetailComponent', () => {
  it('creates the component', () => {
    TestBed.configureTestingModule({ imports: [CharacterDetailComponent] });
    const fixture = TestBed.createComponent(CharacterDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
