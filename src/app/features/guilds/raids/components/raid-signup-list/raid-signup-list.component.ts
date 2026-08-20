import { Component, computed, effect, inject, input, linkedSignal, OnDestroy, signal } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { TranslocoPipe } from '@jsverse/transloco';
import { CLASS_COLORS, wowClassIconUrl } from '../../../../../shared/components/icons/wow-class-icon/wow-class-icon.component';
import { RaidBoardStore } from '../../stores/raid-board.store';
import { RaidEvent } from '../../models/raid-event.model';
import { RaidSignup } from '../../models/raid-signup.model';
import { SignupStatus } from '../../models/signup-status.enum';
import { RaidDragItem } from '../../models/raid-drag-item.model';

/** One class column of the Accepted grid — mirrors `RaidNotificationContentBuilder.BuildSignupCallAsync`'s per-class fields. */
interface AcceptedClassGroup {
  classId: number;
  iconUrl: string | null;
  signups: RaidSignup[];
}

/**
 * Discord-signup-call-style breakdown of every roster member's response to a Signup-mode event —
 * collapsed by default (just the ✅/❓/❌ counts) so it doesn't eat into the vertical space between
 * the slot grid and the roster pool that's reserved for loot management later. Expanded, it mirrors
 * the same organization as the Discord embed (`RaidNotificationContentBuilder.BuildSignupCallAsync`):
 * Accepted grouped into one column per class (only classes with at least one signup — the embed's
 * "always show every class, blank if empty" is a Discord-grid-width workaround that doesn't apply
 * here), Tentative and Declined as flat name lists below. Accepted rows are draggable straight into
 * a slot — same `RaidDragItem` shape and `cdkDropListGroup` the roster pool already uses, so a drop
 * lands through the exact same grid handlers. Read access matches `GetRaidSignupsQuery` (any roster
 * member, not just officers — the same information is already visible to everyone on the Discord
 * signup-call embed); only the drag itself is gated by `disabled` (non-officer viewers). Also
 * joins a live-push group for this event (`RaidBoardStore.joinRaidSignupUpdates`, backed by
 * `/hubs/raid-signup`) so a response change from anyone — web or Discord — refreshes this list
 * without waiting for the next board reload.
 */
@Component({
  selector: 'app-raid-signup-list',
  standalone: true,
  imports: [CdkDrag, CdkDropList, TranslocoPipe],
  templateUrl: './raid-signup-list.component.html',
  styleUrl: './raid-signup-list.component.scss',
})
export class RaidSignupListComponent implements OnDestroy {
  readonly event = input.required<RaidEvent>();
  readonly guildId = input.required<string>();
  readonly guildBranchId = input.required<number>();
  /** True for non-officer viewers — Accepted rows aren't draggable. */
  readonly disabled = input(false);
  /** Highlights the viewer's own response (yellow outline) in the Accepted list. */
  readonly currentUserDiscordId = input<string | null>(null);
  /** Starts expanded instead of the default collapsed state — the raid detail page only ever shows one event, so there's no reason to hide its signups behind a click. */
  readonly initiallyExpanded = input(false);

  readonly #boardStore = inject(RaidBoardStore);

  readonly SignupStatus = SignupStatus;

  // `signal(this.initiallyExpanded())` would freeze on the input's default (`false`): field
  // initializers run before Angular applies the bound input value to a signal input, so a plain
  // one-time read here never sees the real `true` passed by the raid detail page. `linkedSignal`
  // reads lazily (on first access, by which point the binding is live) and still stays a normal
  // writable signal afterward, so `toggleExpanded` keeps working exactly like a plain `signal`.
  readonly expanded = linkedSignal(() => this.initiallyExpanded());
  readonly signups = signal<RaidSignup[]>([]);

  readonly acceptedSignups = computed(() => this.signups().filter((s) => s.status === SignupStatus.Accepted));
  readonly tentativeSignups = computed(() => this.signups().filter((s) => s.status === SignupStatus.Tentative));
  readonly declinedSignups = computed(() => this.signups().filter((s) => s.status === SignupStatus.Declined));

  /** Character IDs already holding a slot in this event — their row is shown but no longer draggable, since they're already placed. */
  readonly assignedCharacterIds = computed(() => new Set(this.event().assignments.map((a) => a.characterId)));

  /** Accepted signups grouped into one column per class, classes in game order, names alphabetical within each. */
  readonly acceptedByClass = computed<AcceptedClassGroup[]>(() => {
    const byClass = new Map<number, RaidSignup[]>();
    for (const s of this.acceptedSignups()) {
      if (s.classId == null) continue;
      const group = byClass.get(s.classId) ?? [];
      group.push(s);
      byClass.set(s.classId, group);
    }

    return [...byClass.entries()]
      .sort(([a], [b]) => a - b)
      .map(([classId, signups]) => ({
        classId,
        iconUrl: wowClassIconUrl(classId),
        signups: [...signups].sort((a, b) => (a.characterName ?? '').localeCompare(b.characterName ?? '')),
      }));
  });

  readonly #unsubscribeSignupChanged: () => void;

  constructor() {
    // `event()` is a brand-new object reference on every board reload (a fresh HTTP response
    // replaces the whole events array) — reusing that as the reactive trigger keeps this list's
    // counts/rows in sync with the board's own refresh cadence without a second polling loop.
    // Also (re-)joins the event's live-push group each time — `JoinRaidEvent` is idempotent
    // server-side (`Groups.AddToGroupAsync` on an already-joined connection is a no-op), so the
    // redundant call on every reload is harmless and avoids a second, differently-scoped effect.
    effect(() => {
      const guildId = this.guildId();
      const guildBranchId = this.guildBranchId();
      const eventId = this.event().id;
      this.#loadSignups(guildId, guildBranchId, eventId);
      this.#boardStore.joinRaidSignupUpdates(guildId, guildBranchId, eventId);
    });

    // Reloads the whole board rather than just re-fetching this list's own signups — a response
    // change also affects `event.ineligiblePlayerDiscordIds`, `event.assignments`,
    // `event.mySignupCharacterId`/`acceptedCharacterIdsByPlayerDiscordId`, all of which live on
    // the board's own `event` object, not in this component's local `signups` state. A board
    // reload replaces `event()` with a fresh reference, which re-runs the effect above and
    // re-fetches this list too — one trigger keeps every consumer of the event in sync instead of
    // just this panel's own display.
    this.#unsubscribeSignupChanged = this.#boardStore.onRaidSignupChanged((changedEventId) => {
      if (changedEventId === this.event().id) {
        this.#boardStore.reload();
      }
    });
  }

  ngOnDestroy(): void {
    this.#unsubscribeSignupChanged();
    this.#boardStore.leaveRaidSignupUpdates(this.guildBranchId(), this.event().id);
  }

  #loadSignups(guildId: string, guildBranchId: number, eventId: number): void {
    this.#boardStore.getSignups(guildId, guildBranchId, eventId).subscribe({
      next: (signups) => this.signups.set(signups),
      error: () => this.signups.set([]),
    });
  }

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  classColor(signup: RaidSignup): string {
    return (signup.classId != null ? CLASS_COLORS[signup.classId] : undefined) ?? 'inherit';
  }

  isOwnSignup(signup: RaidSignup): boolean {
    const currentUserId = this.currentUserDiscordId();
    return currentUserId != null && signup.userDiscordId === currentUserId;
  }

  /** Already holding a slot in this event — dragging it again would be a no-op at best, a confusing duplicate attempt at worst. */
  isAlreadyAssigned(signup: RaidSignup): boolean {
    return signup.characterId != null && this.assignedCharacterIds().has(signup.characterId);
  }

  /** The pool is a drag source only — nothing may be dropped back into it. */
  readonly rejectEnter = (): boolean => false;

  /** Only ever called for Accepted rows, where the server guarantees `characterId`/`classId` are set. */
  dragItem(signup: RaidSignup): RaidDragItem {
    return {
      characterId: signup.characterId!,
      characterName: signup.characterName ?? '',
      classId: signup.classId!,
      classColor: this.classColor(signup),
      playerDiscordId: signup.userDiscordId,
    };
  }

  onDragStarted(signup: RaidSignup): void {
    this.#boardStore.startDrag(signup.userDiscordId, signup.characterId!);
  }

  onDragEnded(): void {
    this.#boardStore.endDrag();
  }
}
