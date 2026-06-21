import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CharacterStore } from './stores/character.store';
import { Character } from './models/character.model';

/**
 * Guarantees CharacterStore is loaded before a route that reads it renders. Routes consume
 * the store reactively via its signals — the resolved value itself is unused.
 */
export const charactersResolver: ResolveFn<Character[]> = () => inject(CharacterStore).loadCharacters();
