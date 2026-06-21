import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Spec } from '../models/spec.model';

@Injectable({ providedIn: 'root' })
export class SpecService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/Specs';

  /** Returns all available WoW specs ordered by Blizzard ID. */
  getAll() {
    return this.#http.get<Spec[]>(this.#api);
  }
}
