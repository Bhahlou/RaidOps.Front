import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconCardComponent } from '../../../../shared/components/icon-card/icon-card.component';

@Component({
  selector: 'app-no-guild',
  imports: [MatIconModule, TranslocoPipe, IconCardComponent],
  templateUrl: './no-guild.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './no-guild.component.scss',
})
export class NoGuildComponent {}
