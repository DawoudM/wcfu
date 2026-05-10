import { Injectable, Inject, signal, NgZone, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { AuthResponse, User } from '../models/user.model';

/**
 * Defines the shape of messages broadcast across tabs via BroadcastChannel.
 */
interface AuthBroadcastMessage {
  type: 'LOGIN' | 'LOGOUT';
  /** The user ID of the account that just logged in (null on logout). */
  userId: number | null;
  /** Timestamp to prevent stale message processing. */
  timestamp: number;
}

/**
 * AuthService — Handles JWT lifecycle, cross-tab session sync, and stale-tab detection.
 *
 * Security Architecture:
 * 1. **BroadcastChannel**: When a user logs in/out in any tab, ALL other tabs
 *    are instantly notified and react (redirect to login or reload with new session).
 * 2. **Page Visibility API**: When a user returns to a previously inactive tab,
 *    we verify the in-memory session matches localStorage. If a different user
 *    is now logged in, we force a full page reload to prevent cross-user data leakage.
 * 3. **Backend Validation**: The Django backend ties all data to `request.user`,
 *    so even if the frontend is bypassed, the server rejects mismatched requests.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private apiUrl = '/api/auth';

  // Reactive state
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  // Cross-tab communication channel
  private authChannel: BroadcastChannel | null = null;

  // Bound listener references for cleanup
  private visibilityHandler: (() => void) | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.loadUserFromStorage();
    this.initCrossTabSync();
    this.initVisibilityCheck();
  }

  ngOnDestroy(): void {
    // Clean up listeners and channels to prevent memory leaks
    this.authChannel?.close();
    if (this.visibilityHandler) {
      this.document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => {
        this.setSession(response);
        this.broadcastAuthEvent('LOGIN', response.user.id);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, data);
  }

  logout(): void {
    this.broadcastAuthEvent('LOGOUT', null);
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      this.clearSession();
      return throwError(() => new Error('No refresh token'));
    }

    return this.http.post<{ access: string }>(`${this.apiUrl}/token/refresh/`, { refresh }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
      }),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // ─── Session Management ───────────────────────────────────────────────

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('access_token', authResult.access);
    localStorage.setItem('refresh_token', authResult.refresh);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
    this.isAuthenticated.set(true);
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('user');
    const token = this.getAccessToken();
    if (userStr && token) {
      this.currentUser.set(JSON.parse(userStr));
      this.isAuthenticated.set(true);
    }
  }

  // ─── Cross-Tab Synchronization (BroadcastChannel) ─────────────────────

  /**
   * Initializes a BroadcastChannel named 'health_auth'.
   * When another tab logs in or out, this tab reacts immediately.
   */
  private initCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') {
      // Fallback for environments without BroadcastChannel (very rare)
      return;
    }

    this.authChannel = new BroadcastChannel('health_auth');

    this.authChannel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
      this.ngZone.run(() => {
        const message = event.data;

        if (message.type === 'LOGOUT') {
          // Another tab logged out — clear this tab's session and redirect
          this.clearSession();
          this.router.navigate(['/auth/login']);
        } else if (message.type === 'LOGIN') {
          // Another tab logged in (possibly as a different user)
          // Reload the session state from localStorage to pick up the new user
          const currentUserId = this.currentUser()?.id ?? null;

          if (currentUserId !== message.userId) {
            // A DIFFERENT user just logged in on another tab.
            // Force a full page reload to ensure all in-memory component state
            // (forms, cached data) is flushed and rebuilt for the new user.
            window.location.reload();
          }
        }
      });
    };
  }

  /**
   * Broadcasts an auth event (login/logout) to all other open tabs.
   */
  private broadcastAuthEvent(type: 'LOGIN' | 'LOGOUT', userId: number | null): void {
    this.authChannel?.postMessage({
      type,
      userId,
      timestamp: Date.now()
    } as AuthBroadcastMessage);
  }

  // ─── Stale Tab Detection (Page Visibility API) ────────────────────────

  /**
   * When the user switches back to a previously hidden tab, we verify that
   * the in-memory session still matches what's in localStorage.
   *
   * This catches edge cases where the BroadcastChannel message was missed
   * (e.g., the tab was frozen/suspended by the browser's tab discarding).
   */
  private initVisibilityCheck(): void {
    this.visibilityHandler = () => {
      if (this.document.visibilityState === 'visible') {
        this.ngZone.run(() => this.verifySessionIntegrity());
      }
    };

    // Run outside Angular zone to avoid triggering unnecessary change detection
    // on every visibility change across all tabs
    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('visibilitychange', this.visibilityHandler!);
    });
  }

  /**
   * Compares the in-memory user with the user stored in localStorage.
   * If they differ, it means another tab changed the session.
   */
  private verifySessionIntegrity(): void {
    const storedUserStr = localStorage.getItem('user');
    const storedToken = localStorage.getItem('access_token');
    const inMemoryUser = this.currentUser();

    // Case 1: User was logged in but localStorage was cleared (logged out in another tab)
    if (inMemoryUser && (!storedUserStr || !storedToken)) {
      this.clearSession();
      this.router.navigate(['/auth/login']);
      return;
    }

    // Case 2: User was not logged in but localStorage now has a session
    if (!inMemoryUser && storedUserStr && storedToken) {
      window.location.reload();
      return;
    }

    // Case 3: Both exist — check if it's the SAME user
    if (inMemoryUser && storedUserStr) {
      const storedUser: User = JSON.parse(storedUserStr);
      if (storedUser.id !== inMemoryUser.id) {
        // Different user! Force full reload to flush all component state.
        window.location.reload();
      }
    }
  }
}
