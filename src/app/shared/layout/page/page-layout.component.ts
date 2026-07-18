import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { AuthStore } from '../../../core/stores/auth.store';
import { LoadingBarComponent } from '../../components/feedback/loading-bar/loading-bar.component';

@Component({
  selector: 'app-page-layout',
  imports: [RouterOutlet, HeaderComponent, LoadingBarComponent, SidenavComponent],
  templateUrl: './page-layout.component.html',
  styleUrl: './page-layout.component.scss',
})
export class PageLayoutComponent {
  readonly isAuthenticated = inject(AuthStore).isAuthenticated;
}
