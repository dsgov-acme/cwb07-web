import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { DocumentUtil } from '@dsg/shared/data-access/document-api';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { AttachmentCardComponent, LoadingService, NuverialIconComponent } from '@dsg/shared/ui/nuverial';
import { Observable, forkJoin, map } from 'rxjs';

interface DocumentPreview {
  fileName: string;
  preview: unknown;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent, AttachmentCardComponent],
  selector: 'dsg-attachments-list-view',
  standalone: true,
  styleUrls: ['./attachments-list-view.component.scss'],
  templateUrl: './attachments-list-view.component.html',
})
export class AttachmentsListViewComponent implements OnInit {
  /**
   * List of attachment IDs
   */
  @Input() public attachments!: string[];

  /**
   * Names of attachments
   */
  @Input() public attachmentNames: Record<string, string> = {};

  /**
   * Determines whether or not we show previews
   */
  @Input() public showPreview = false;

  public filePreviews$: Observable<Record<string, unknown>> | undefined;

  constructor(
    protected _changeDetectorRef: ChangeDetectorRef,
    private readonly _documentFormService: DocumentFormService,
    private readonly _loadingService: LoadingService,
  ) {}

  public ngOnInit(): void {
    if (this.showPreview) {
      this.filePreviews$ = forkJoin(
        this.attachments.map(attachment => {
          return this._documentFormService.getDocumentFileDataById$(attachment).pipe(
            this._loadingService.switchMapWithLoading(blob => {
              const fileName = this.attachmentNames[attachment];
              const loadedFile = new File([blob], fileName, { type: blob.type });

              return new Observable<DocumentPreview>(observer => {
                DocumentUtil.setImagePreview(loadedFile, (result: unknown) => {
                  observer.next({ fileName: loadedFile.name, preview: result });
                  observer.complete();
                  this._changeDetectorRef.markForCheck();
                });
              });
            }),
          );
        }),
      ).pipe(
        map(results => {
          const previews: Record<string, unknown> = {};
          results.forEach(preview => {
            previews[preview.fileName] = preview.preview;
          });

          return previews;
        }),
      );
    }

    this._changeDetectorRef.markForCheck();
  }

  public trackByFn(index: number): number {
    return index;
  }

  public onClick(event: Event) {
    event.stopPropagation();
  }

  public downloadFile(attachmentId: string): void {
    this._documentFormService.downloadDocument$(attachmentId, this.attachmentNames[attachmentId] || attachmentId).subscribe();
  }
}
