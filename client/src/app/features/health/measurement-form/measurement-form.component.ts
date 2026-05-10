import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { HealthService } from '../../../core/services/health.service';
import { ResultsDashboardComponent } from '../results-dashboard/results-dashboard.component';

@Component({
  selector: 'app-measurement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    ResultsDashboardComponent
  ],
  templateUrl: './measurement-form.component.html',
  styleUrls: ['./measurement-form.component.scss']
})
export class MeasurementFormComponent implements OnInit {
  measurementForm: FormGroup;
  isLoading = false;
  isInitialLoad = true;
  serverErrors: any = {};

  constructor(
    private fb: FormBuilder,
    public healthService: HealthService,
    private snackBar: MatSnackBar
  ) {
    this.measurementForm = this.fb.group({
      height_cm: [null, [Validators.required, Validators.min(50), Validators.max(300)]],
      weight_kg: [null, [Validators.required, Validators.min(1), Validators.max(500)]],
      waist_cm: [null, [Validators.min(30), Validators.max(300)]],
      age: [null, [Validators.required, Validators.min(1), Validators.max(120)]],
      sex: ['M', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentMeasurement();
  }

  loadCurrentMeasurement(): void {
    this.healthService.getMeasurement().subscribe({
      next: (data) => {
        this.measurementForm.patchValue({
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          waist_cm: data.waist_cm,
          age: data.age,
          sex: data.sex
        });
        this.isInitialLoad = false;
      },
      error: (err) => {
        // 404 is expected for new users
        this.isInitialLoad = false;
      }
    });
  }

  onSubmit(): void {
    if (this.measurementForm.invalid) {
      this.measurementForm.markAllAsTouched();
      this.snackBar.open('Please fix the highlighted errors before calculating.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    this.serverErrors = {};

    this.healthService.saveMeasurement(this.measurementForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Measurements saved and results updated!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 400 && err.error) {
          this.serverErrors = err.error;
        } else {
          this.snackBar.open('Failed to save measurements. Please try again.', 'Close', {
            duration: 4000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }
}
