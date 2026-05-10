import { Routes } from '@angular/router';
import { HealthContainerComponent } from './health-container.component';
import { MeasurementFormComponent } from './measurement-form/measurement-form.component';

export default [
  {
    path: '',
    component: HealthContainerComponent,
    children: [
      { path: 'measurement', component: MeasurementFormComponent },
      { path: '', redirectTo: 'measurement', pathMatch: 'full' }
    ]
  }
] as Routes;
