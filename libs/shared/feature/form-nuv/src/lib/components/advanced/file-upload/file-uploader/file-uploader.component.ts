import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DocumentFormService,
  FileStatus,
  FileUploadBrowserComponent,
  NuverialFileProcessorTooltipComponent,
  getStatusFromCode,
} from '@dsg/shared/feature/documents';
import { NUVERIAL_FILE_UPLOAD_STATUS, NuverialIconComponent } from '@dsg/shared/ui/nuverial';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EMPTY, Observable, catchError, defaultIfEmpty, forkJoin, map, of, switchMap, take } from 'rxjs';
import { FormRendererService } from '../../../../services/form-renderer.service';
import { FormlyBaseComponent } from '../../../base';
import { FileUploadFieldProperties } from '../models/formly-file-upload.model';

interface DocumentEntryWithStatus {
  documentId: string;
  failed: boolean;
  filename: string;
}

interface DocumentEntry {
  documentId: string;
  filename: string;
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FileUploadBrowserComponent, NuverialFileProcessorTooltipComponent, NuverialIconComponent, MatTooltipModule],
  selector: 'dsg-file-uploader',
  standalone: true,
  styleUrls: ['./file-uploader.component.scss'],
  templateUrl: './file-uploader.component.html',
})
export class FormlyFileUploaderComponent extends FormlyBaseComponent<FileUploadFieldProperties> {
  public loading = false;
  public fileStatus: Map<string, FileStatus> = new Map();
  public filePreview: Map<string, File> = new Map();

  public documentList$: Observable<DocumentEntryWithStatus[]> = of([]).pipe(
    map(() => {
      if (!this.formControl.value) return [];

      if (this.field.props.multiple && Array.isArray(this.formControl.value)) {
        return this.formControl.value;
      } else {
        return [this.formControl.value];
      }
    }),
    switchMap((documents: DocumentEntry[]) => {
      const observables = documents.map(document => {
        return this._documentFormService.getProcessingResultsById$(document.documentId).pipe(
          map(_ => {
            return {
              ...document,
              failed: false,
            } as DocumentEntryWithStatus;
          }),
          take(1),
          catchError(error => {
            const code = error.status;
            const status = getStatusFromCode(code);

            if (status === NUVERIAL_FILE_UPLOAD_STATUS.failedAntivirusCheck) {
              return of({
                ...document,
                failed: true,
              } as DocumentEntryWithStatus);
            }

            return EMPTY;
          }),
        );
      });

      return forkJoin(observables).pipe(defaultIfEmpty([]));
    }),
    take(1),
  );

  constructor(private readonly _formRendererService: FormRendererService, private readonly _documentFormService: DocumentFormService) {
    super();
  }

  public get transactionId(): string {
    return this._formRendererService.transactionId;
  }

  public trackByFn(index: number): number {
    return index;
  }

  public openDocument(document: DocumentEntryWithStatus): void {
    if (document.failed) return;

    this._documentFormService.openDocument$(document.documentId).pipe(take(1)).subscribe();
  }
}
