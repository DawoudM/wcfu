import { Component, Inject, effect, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-icon-button (click)="toggleTheme()" aria-label="Toggle theme">
      <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `
})
export class ThemeToggleComponent {
  isDark = signal<boolean>(false);

  constructor(@Inject(DOCUMENT) private document: Document) {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (saved === 'dark' || (!saved && prefersDark)) {
      this.isDark.set(true);
      this.applyTheme(true);
    }
  }

  toggleTheme() {
    this.isDark.update(v => !v);
    this.applyTheme(this.isDark());
    localStorage.setItem('theme', this.isDark() ? 'dark' : 'light');
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      this.document.body.classList.add('dark-theme');
    } else {
      this.document.body.classList.remove('dark-theme');
    }
  }
}
