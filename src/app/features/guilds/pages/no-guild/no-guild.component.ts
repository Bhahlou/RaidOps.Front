import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { IconCardComponent } from '../../../../shared/components/layout/icon-card/icon-card.component';

@Component({
  selector: 'app-no-guild',
  imports: [TranslocoPipe, IconCardComponent],
  templateUrl: './no-guild.component.html',
  styleUrl: './no-guild.component.scss',
})
export class NoGuildComponent {}
