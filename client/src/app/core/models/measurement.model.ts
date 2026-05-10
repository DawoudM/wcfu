import { HealthResult } from './health-result.model';

export interface BodyMeasurement {
  height_cm: number;
  weight_kg: number;
  waist_cm?: number | null;
  age: number;
  sex: 'M' | 'F';
  updated_at?: string;
  result?: HealthResult;
}
