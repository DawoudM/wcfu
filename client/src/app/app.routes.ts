import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
  },
  {
    path: 'health',
    canActivate: [authGuard],
    loadChildren: () => import('./features/health/health.routes')
  },
  { path: '**', redirectTo: 'auth/login' }
];
