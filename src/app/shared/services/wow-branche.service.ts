import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Branch } from '../models/branch.model';

@Service()
export class WowBrancheService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl + '/WowBranches';

  /** Returns all available WoW branches ordered by ID. */
  getAll() {
    return this.#http.get<Branch[]>(this.#api);
  }
}
