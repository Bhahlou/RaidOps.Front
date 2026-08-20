import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Service()
export class ChangelogService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  /** Records that the current user has acknowledged the given changelog entries. */
  markSeen(entryIds: string[]): Observable<void> {
    return this.#http.post<void>(`${this.#api}/user/changelog-seen`, { entryIds });
  }
}
