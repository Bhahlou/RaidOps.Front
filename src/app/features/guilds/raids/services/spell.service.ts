import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Spell } from '../models/spell.model';

/**
 * Thin HTTP wrapper over the spell search endpoint. Spells are public reference data, so the search
 * is keyed on an expansion only — every spell picker (attribution template editor, raid buff admin
 * screen) goes through this one call.
 */
@Service()
export class SpellService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Searches the spells of an expansion by localized name substring, each already resolved to its name and icon on that expansion. */
  search(expansionId: number, searchTerm: string, locale: string): Observable<Spell[]> {
    return this.#http.get<Spell[]>(`${this.#api}/spells/search`, {
      params: { expansionId, searchTerm, locale },
    });
  }
}
