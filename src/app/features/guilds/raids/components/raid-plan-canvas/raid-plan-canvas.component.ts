import { Component, computed, input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DEFAULT_RAID_PLAN_ASPECT_RATIO, raidPlanBackgroundOption, raidPlanBackgroundUrl } from '../../models/raid-plan-backgrounds.enum';

/**
 * Renders one raid-plan page's background at its declared aspect ratio — the surface that PR3/PR4
 * will layer draggable icon/text/shape elements onto. Purely a viewer for now: no elements, no
 * editing, just the background (or an empty placeholder while none is picked).
 */
@Component({
  selector: 'app-raid-plan-canvas',
  imports: [TranslocoPipe],
  templateUrl: './raid-plan-canvas.component.html',
  styleUrl: './raid-plan-canvas.component.scss',
})
export class RaidPlanCanvasComponent {
  readonly backgroundKey = input<string | null>(null);

  readonly backgroundUrl = computed(() => {
    const key = this.backgroundKey();
    return key ? raidPlanBackgroundUrl(key) : null;
  });

  readonly aspectRatio = computed(() => {
    const key = this.backgroundKey();
    return (key && raidPlanBackgroundOption(key)?.aspectRatio) || DEFAULT_RAID_PLAN_ASPECT_RATIO;
  });
}
