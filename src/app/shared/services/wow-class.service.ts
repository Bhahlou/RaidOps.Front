import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { WowClass } from '../models/wow-class.model';

@Service()
export class WowClassService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/wowclasses';

  /** Returns all WoW classes ordered by Blizzard ID. */
  getAll() {
    return this.#http.get<WowClass[]>(this.#api);
  }
}
