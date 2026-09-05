import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { RaidZone } from '../models/raid-zone.model';
import { RaidSeries, RaidSeriesPayload } from '../models/raid-series.model';
import { RaidBoard, RaidEvent, RaidEventChoice, RaidEventPayload } from '../models/raid-event.model';
import { GuildBranchLockoutWeek } from '../models/guild-branch-lockout-week.model';
import { RaidEventAssignedCharacter } from '../models/raid-event-assigned-character.model';
import { RaidSignup } from '../models/raid-signup.model';
import { SignupStatus } from '../models/signup-status.enum';
import { DiscordChannel } from '../../../../shared/models/discord-channel.model';

/** Thin HTTP wrapper over every `api/v1/guilds/{guildId}/branches/{guildBranchId}/raids/...` endpoint. */
@Service()
export class RaidsService {
  readonly #http = inject(HttpClient);
  readonly #api = environment.apiUrl;

  #base(guildId: string, guildBranchId: number): string {
    return `${this.#api}/guilds/${guildId}/branches/${guildBranchId}/raids`;
  }

  /** Returns the raid zones available for the branch's WoW game version, reference data. */
  getZones(guildId: string, guildBranchId: number): Observable<RaidZone[]> {
    return this.#http.get<RaidZone[]>(`${this.#base(guildId, guildBranchId)}/zones`);
  }

  /** Returns the current weekly raid-lockout window for the branch, or nulls if its region isn't configured yet. */
  getLockoutWeek(guildId: string, guildBranchId: number): Observable<GuildBranchLockoutWeek> {
    return this.#http.get<GuildBranchLockoutWeek>(`${this.#base(guildId, guildBranchId)}/lockout-week`);
  }

  /** Returns every raid series (active and inactive) configured for the guild branch. */
  getSeriesList(guildId: string, guildBranchId: number): Observable<RaidSeries[]> {
    return this.#http.get<RaidSeries[]>(`${this.#base(guildId, guildBranchId)}/series`);
  }

  createSeries(guildId: string, guildBranchId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/series`, payload);
  }

  updateSeries(guildId: string, guildBranchId: number, seriesId: number, payload: RaidSeriesPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/series/${seriesId}`, payload);
  }

  /**
   * Stops a recurring series from generating any further occurrence. `deleteEmptyOccurrences`
   * additionally bulk-deletes the ones it already produced that are still draft with no
   * assignments — anything published or with roster history is always left untouched.
   */
  deactivateSeries(guildId: string, guildBranchId: number, seriesId: number, deleteEmptyOccurrences: boolean): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/series/${seriesId}/deactivate`, { deleteEmptyOccurrences });
  }

  /** Idempotently materializes any due series occurrence within the range — call before loading the board. */
  materializeOccurrences(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/materialize`, null, {
      params: { rangeStart, rangeEnd },
    });
  }

  /** Fetches every raid event (with assignments and resolved member availability) within a date range. */
  getBoard(guildId: string, guildBranchId: number, rangeStart: string, rangeEnd: string): Observable<RaidBoard> {
    return this.#http.get<RaidBoard>(`${this.#base(guildId, guildBranchId)}/board`, {
      params: { rangeStart, rangeEnd },
    });
  }

  /** Fetches a single raid event (with assignments and resolved member availability) — backs the raid detail page. */
  getEvent(guildId: string, guildBranchId: number, eventId: number): Observable<RaidEvent> {
    return this.#http.get<RaidEvent>(`${this.#base(guildId, guildBranchId)}/events/${eventId}`);
  }

  /**
   * Officer-only — lists the branch's raid events (draft and published) within the lockout window
   * around `aroundStartsAtUtc`, for the create/edit dialogs' "extends the lockout of" picker.
   * Independent of the board's currently loaded range or single-event mode, unlike sourcing
   * candidates from `RaidBoardStore.events()`.
   */
  getEventChoices(guildId: string, guildBranchId: number, aroundStartsAtUtc: string): Observable<RaidEventChoice[]> {
    return this.#http.get<RaidEventChoice[]>(`${this.#base(guildId, guildBranchId)}/events/choices`, {
      params: { aroundStartsAtUtc },
    });
  }

  createEvent(guildId: string, guildBranchId: number, payload: RaidEventPayload): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events`, payload);
  }

  updateEvent(guildId: string, guildBranchId: number, eventId: number, payload: RaidEventPayload): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}`, payload);
  }

  /** Permanently deletes the event, including any slot assignments it has. */
  deleteEvent(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#http.delete<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}`);
  }

  /** Officer-only — makes a draft event visible to every roster member. One-way, no request body. */
  publish(guildId: string, guildBranchId: number, eventId: number): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/publish`, {});
  }

  /** Officer-only — lists the characters currently assigned to a raid event, for the grouping-ping character picker. */
  getAssignedCharacters(guildId: string, guildBranchId: number, eventId: number): Observable<RaidEventAssignedCharacter[]> {
    return this.#http.get<RaidEventAssignedCharacter[]>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/assigned-characters`);
  }

  /**
   * Officer-only — posts a one-off "whisper this character for an invite" ping. Without
   * `characterName`, the backend resolves the requester's own assigned character in this raid and
   * fails with `RaidGroupingRequesterHasNoCharacter` if they don't have one. Fails if the event
   * isn't published or no composition announcement channel is configured.
   */
  announceGrouping(guildId: string, guildBranchId: number, eventId: number, characterName?: string): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/announce-grouping`, { characterName: characterName ?? null });
  }

  /** Sets the requesting member's own Accepted/Tentative/Declined response to a Signup-mode raid event — `characterId` is required when `status` is Accepted. */
  setMySignup(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    status: SignupStatus,
    characterId: number | null = null,
    specId: number | null = null,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/signup`, { status, characterId, specId });
  }

  /** Every roster member's current response to a Signup-mode raid event. */
  getSignups(guildId: string, guildBranchId: number, eventId: number): Observable<RaidSignup[]> {
    return this.#http.get<RaidSignup[]>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/signups`);
  }

  /** Officer-only — creates a new Discord text channel, for immediate use as a raid's dedicated announcement channel. */
  createAnnouncementChannel(guildId: string, guildBranchId: number, name: string, categoryId: string | null = null): Observable<{ body: DiscordChannel }> {
    return this.#http.post<{ body: DiscordChannel }>(`${this.#base(guildId, guildBranchId)}/announcement-channel`, { name, categoryId });
  }

  assignSlot(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumber: number,
    slotNumber: number,
    characterId: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/slots/assign`, {
      groupNumber,
      slotNumber,
      characterId,
    });
  }

  swapSlotAssignments(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumberA: number,
    slotNumberA: number,
    groupNumberB: number,
    slotNumberB: number,
  ): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/slots/swap`, {
      groupNumberA,
      slotNumberA,
      groupNumberB,
      slotNumberB,
    });
  }

  unassignSlot(guildId: string, guildBranchId: number, eventId: number, groupNumber: number, slotNumber: number): Observable<void> {
    return this.#http.post<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/slots/unassign`, {
      groupNumber,
      slotNumber,
    });
  }

  updateSlotSpec(
    guildId: string,
    guildBranchId: number,
    eventId: number,
    groupNumber: number,
    slotNumber: number,
    specId: number,
  ): Observable<void> {
    return this.#http.patch<void>(`${this.#base(guildId, guildBranchId)}/events/${eventId}/slots/spec`, {
      groupNumber,
      slotNumber,
      specId,
    });
  }
}
