import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, Observable } from 'rxjs';

import { charactersResolver } from './characters.resolver';
import { CharacterStore } from './stores/character.store';
import { Character } from './models/character.model';

describe('charactersResolver', () => {
  it('delegates to CharacterStore.loadCharacters', () => {
    const chars: Character[] = [];
    const loadCharacters = vi.fn().mockReturnValue(of(chars));

    TestBed.configureTestingModule({
      providers: [{ provide: CharacterStore, useValue: { loadCharacters } }],
    });

    let result: Character[] | undefined;
    TestBed.runInInjectionContext(() => {
      const value = charactersResolver({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<Character[]>;
      value.subscribe((c) => { result = c; });
    });

    expect(loadCharacters).toHaveBeenCalled();
    expect(result).toBe(chars);
  });
});
