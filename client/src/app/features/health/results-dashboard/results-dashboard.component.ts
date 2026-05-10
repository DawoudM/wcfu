import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { HealthService } from '../../../core/services/health.service';

@Component({
  selector: 'app-results-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
  templateUrl: './results-dashboard.component.html',
  styleUrls: ['./results-dashboard.component.scss']
})
export class ResultsDashboardComponent {
  constructor(public healthService: HealthService) {}

  getBadgeClass(classification: string | null): string {
    if (!classification) return 'badge-neutral';
    
    const lower = classification.toLowerCase();
    if (lower.includes('healthy') || lower.includes('normal') || lower.includes('fitness') || lower.includes('athletic')) {
      return 'badge-success';
    }
    if (lower.includes('under') || lower.includes('over') || lower.includes('moderate')) {
      return 'badge-warning';
    }
    if (lower.includes('obese') || lower.includes('high')) {
      return 'badge-error';
    }
    return 'badge-neutral';
  }
}
