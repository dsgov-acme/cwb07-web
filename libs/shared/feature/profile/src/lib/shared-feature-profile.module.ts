import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { sharedFeatureProfileRoutes } from './shared-feature-profile.routes';

@NgModule({
  imports: [CommonModule, RouterModule.forChild(sharedFeatureProfileRoutes)],
})
export class SharedFeatureProfileModule {}
