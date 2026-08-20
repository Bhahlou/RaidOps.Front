import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { wowClassIconUrl } from '../../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidDragItem } from '../../models/raid-drag-item.model';
import { GuildRosterMember } from '../../../models/guild-roster-member.model';
import { CharacterRank } from '../../../models/character-rank.enum';

/** One class column of the Available grid — same organization as `RaidSignupListComponent`'s Accepted breakdown. */
interface AvailableClassGroup {
  classId: number;
  iconUrl: string | null;
  members: GuildRosterMember[];
}

/** A player with at least one declared-absent character for this event — see `unavailablePlayers`. */
interface UnavailablePlayer {
  playerDiscordId: string;
  playerName: string;
}

const RANKS: CharacterRank[] = [CharacterRank.Main, CharacterRank.Split, CharacterRank.Alt];

/**
 * Discord-signup-call-style breakdown of the branch roster's availability for a `DefaultPresent`
 * event — the friendlier counterpart to `RaidSignupListComponent` for raids that don't use the
 * Signup opt-in flow. Availability itself isn't a per-event response the way a signup is: it's
 * `event.ineligiblePlayerDiscordIds`, already resolved server-side from each player's declared
 * calendar absences (see `RaidAvailabilityService`) — so this component only has two buckets
 * (Available / Unavailable), no Tentative/no-response tier. Collapsed by default (just the counts)
 * like the signup list; the raid detail page expands it by default via `initiallyExpanded` since
 * it only ever shows one raid. Available rows are draggable straight into a slot, same
 * `RaidDragItem`/`cdkDropListGroup` wiring as the roster pool and signup list, so it's a genuine
 * replacement for the pool's drag-source role on `DefaultPresent` raids, not just a read-only view.
 * Absence is declared per player, not per character, so the Unavailable bucket collapses down to
 * one row per player (by name) rather than one per character — a player's alts add no information
 * there.
 */
@Component({
  selector: 'app-raid-available-roster',
  standalone: true,
  imports: [CdkDrag, CdkDropList, TranslocoPipe],
  templateUrl: './raid-available-roster.component.html',
  styleUrl: './raid-available-roster.component.scss',
})
export class RaidAvailableRosterComponent {
  readonly event = input.required<RaidEvent>();
  readonly rosterMembers = input<GuildRosterMember[]>([]);
  /** True for non-officer viewers — Available rows aren't draggable. */
  readonly disabled = input(false);
  /** Highlights the viewer's own characters (yellow outline) in the Available list. */
  readonly currentUserDiscordId = input<string | null>(null);
  /** Starts expanded instead of the default collapsed state — the raid detail page only ever shows one event. */
  readonly initiallyExpanded = input(false);

  readonly #boardStore = inject(RaidBoardStore);

  readonly ranks = RANKS;

  // `signal(this.initiallyExpanded())` would freeze on the input's default (`false`): field
  // initializers run before Angular applies the bound input value to a signal input, so a plain
  // one-time read here never sees the real `true` passed by the raid detail page. `linkedSignal`
  // reads lazily (on first access, by which point the binding is live) and still stays a normal
  // writable signal afterward, so `toggleExpanded` keeps working exactly like a plain `signal`.
  readonly expanded = linkedSignal(() => this.initiallyExpanded());
  readonly rankFilter = signal<CharacterRank[]>([]);

  readonly #ineligiblePlayerIds = computed(() => new Set(this.event().ineligiblePlayerDiscordIds));
  readonly #assignedCharacterIds = computed(() => new Set(this.event().assignments.map((a) => a.characterId)));

  /** Available characters, narrowed by the rank filter (a character-level attribute, so it applies here). */
  readonly availableMembers = computed(() => {
    const ranks = this.rankFilter();
    const available = this.rosterMembers().filter((m) => !this.#ineligiblePlayerIds().has(m.playerDiscordId));
    return ranks.length > 0 ? available.filter((m) => ranks.includes(m.characterRank)) : available;
  });

  /**
   * Every declared-absent player, one row each regardless of how many characters they have on the
   * roster — the rank filter doesn't apply here (it's a per-character attribute, this list is
   * per-player), and only the player's name matters, not which of their characters is unavailable.
   */
  readonly unavailablePlayers = computed<UnavailablePlayer[]>(() => {
    const ineligible = this.#ineligiblePlayerIds();
    const byPlayer = new Map<string, UnavailablePlayer>();
    for (const m of this.rosterMembers()) {
      if (ineligible.has(m.playerDiscordId) && !byPlayer.has(m.playerDiscordId)) {
        byPlayer.set(m.playerDiscordId, { playerDiscordId: m.playerDiscordId, playerName: m.playerName ?? m.playerDiscordId });
      }
    }
    return [...byPlayer.values()].sort((a, b) => a.playerName.localeCompare(b.playerName));
  });

  /** Available members grouped into one column per class, classes in game order, names alphabetical within each. */
  readonly availableByClass = computed<AvailableClassGroup[]>(() => {
    const byClass = new Map<number, GuildRosterMember[]>();
    for (const m of this.availableMembers()) {
      const group = byClass.get(m.classId) ?? [];
      group.push(m);
      byClass.set(m.classId, group);
    }

    return [...byClass.entries()]
      .sort(([a], [b]) => a - b)
      .map(([classId, members]) => ({
        classId,
        iconUrl: wowClassIconUrl(classId),
        members: [...members].sort((a, b) => a.characterName.localeCompare(b.characterName)),
      }));
  });

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  isRankSelected(rank: CharacterRank): boolean {
    return this.rankFilter().includes(rank);
  }

  toggleRank(rank: CharacterRank): void {
    const current = this.rankFilter();
    this.rankFilter.set(current.includes(rank) ? current.filter((r) => r !== rank) : [...current, rank]);
  }

  mainSpecIconUrl(member: GuildRosterMember): string | null {
    return member.raidSpecs.find((s) => s.isMain)?.iconUrl ?? null;
  }

  isOwnCharacter(member: GuildRosterMember): boolean {
    const currentUserId = this.currentUserDiscordId();
    return currentUserId != null && member.playerDiscordId === currentUserId;
  }

  /** Already holding a slot in this event — dragging it again would be a no-op at best, a confusing duplicate attempt at worst. */
  isAlreadyAssigned(member: GuildRosterMember): boolean {
    return this.#assignedCharacterIds().has(member.characterId);
  }

  /** The list is a drag source only — nothing may be dropped back into it. */
  readonly rejectEnter = (): boolean => false;

  dragItem(member: GuildRosterMember): RaidDragItem {
    return {
      characterId: member.characterId,
      characterName: member.characterName,
      classId: member.classId,
      classColor: member.classColor,
      playerDiscordId: member.playerDiscordId,
    };
  }

  onDragStarted(member: GuildRosterMember): void {
    this.#boardStore.startDrag(member.playerDiscordId, member.characterId);
  }

  onDragEnded(): void {
    this.#boardStore.endDrag();
  }
}
