import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    ThemeToggleComponent
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  serverErrors: any = {};
  isLoading = false;
  hidePassword = true;
  hidePasswordConfirm = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('password_confirm');
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ ...confirm.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      // Mark all fields as touched so mat-error messages appear instantly
      this.registerForm.markAllAsTouched();
      this.snackBar.open('Please fix the highlighted errors before submitting.', 'Close', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isLoading = true;
    this.serverErrors = {};

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.snackBar.open('Account created! Logging you in...', 'Close', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        // Automatically login after successful registration
        const { username, password } = this.registerForm.value;
        this.authService.login({ username, password }).subscribe({
          next: () => this.router.navigate(['/health/measurement']),
          error: () => {
            this.snackBar.open('Account created! Please log in manually.', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
            this.router.navigate(['/auth/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 400 && err.error) {
          this.serverErrors = err.error;
          // Build a user-friendly summary of server errors
          const errorMessages: string[] = [];
          for (const [field, messages] of Object.entries(err.error)) {
            if (Array.isArray(messages)) {
              errorMessages.push(...messages as string[]);
            }
          }
          this.snackBar.open(
            errorMessages.length > 0 ? errorMessages[0] : 'Registration failed. Check the form.',
            'Close',
            { duration: 5000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] }
          );
        } else {
          this.serverErrors = { non_field_errors: ['An error occurred during registration.'] };
          this.snackBar.open('An unexpected error occurred. Please try again.', 'Close', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }
}
