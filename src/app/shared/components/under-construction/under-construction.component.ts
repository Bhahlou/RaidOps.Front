import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-under-construction',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './under-construction.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './under-construction.component.scss',
})
export class UnderConstructionComponent {}
