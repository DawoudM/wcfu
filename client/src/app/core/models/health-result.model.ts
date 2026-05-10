export interface HealthResult {
  bmi: number;
  bmi_classification: string;
  ibw_kg: number;
  wthr: number | null;
  wthr_classification: string | null;
  lbm_kg: number;
  bfp: number;
  bfp_classification: string;
  calculated_at: string;
}
