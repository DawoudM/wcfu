import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { BodyMeasurement } from '../models/measurement.model';

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private apiUrl = '/api/health';
  
  // Reactive state for the current measurement and results
  currentMeasurement = signal<BodyMeasurement | null>(null);

  constructor(private http: HttpClient) {}

  getMeasurement(): Observable<BodyMeasurement> {
    return this.http.get<BodyMeasurement>(`${this.apiUrl}/measurement/`).pipe(
      tap(data => this.currentMeasurement.set(data))
    );
  }

  saveMeasurement(data: any): Observable<BodyMeasurement> {
    return this.http.put<BodyMeasurement>(`${this.apiUrl}/measurement/`, data).pipe(
      tap(updatedData => this.currentMeasurement.set(updatedData))
    );
  }
}
