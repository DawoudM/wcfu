import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-health-container',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    ThemeToggleComponent
  ],
  template: `
    <div class="app-layout">
      <mat-toolbar color="primary" class="app-toolbar elevation-z4">
        <mat-icon>fitness_center</mat-icon>
        <span class="title">Health Calculator</span>
        
        <span class="spacer"></span>
        
        <div class="user-info" *ngIf="authService.currentUser() as user">
          <mat-icon>account_circle</mat-icon>
          <span class="username">{{ user.username }}</span>
        </div>
        
        <app-theme-toggle></app-theme-toggle>
        
        <button mat-icon-button (click)="logout()" aria-label="Logout" matTooltip="Logout">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--mat-sys-surface-container-lowest);
    }
    .app-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 1000;
      
      .title {
        font-weight: 500;
        margin-left: 8px;
      }
      .spacer {
        flex: 1 1 auto;
      }
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 16px;
      font-size: 0.875rem;
      
      .username {
        font-weight: 500;
      }
    }
    .main-content {
      flex: 1;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
  `]
})
export class HealthContainerComponent {
  constructor(public authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
