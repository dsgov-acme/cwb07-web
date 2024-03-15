import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NuverialReadOnlyDataComponent, NuverialRichTextViewerComponent } from '@dsg/shared/ui/nuverial';
import { FormioBaseCustomComponent } from '../../base';
import { FormlyReadOnlyDataFieldProperties } from '../formly/formly-read-only-data.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialReadOnlyDataComponent, NuverialRichTextViewerComponent],
  selector: 'dsg-formio-read-only-data',
  standalone: true,
  styleUrls: ['./formio-read-only-data.component.scss'],
  templateUrl: './formio-read-only-data.component.html',
})
export class FormioReadOnlyDataComponent extends FormioBaseCustomComponent<string, FormlyReadOnlyDataFieldProperties> {}
