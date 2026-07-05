import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { LoadingBarComponent } from '../../components/loading-bar/loading-bar.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-page-layout',
  imports: [RouterOutlet, HeaderComponent, LoadingBarComponent, SidenavComponent],
  templateUrl: './page-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-layout.component.scss',
})
export class PageLayoutComponent {
  readonly isAuthenticated = inject(AuthStore).isAuthenticated;
}
