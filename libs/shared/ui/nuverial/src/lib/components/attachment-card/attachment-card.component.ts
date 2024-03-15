import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NuverialIconComponent } from '../icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent],
  selector: 'nuverial-attachment-card',
  standalone: true,
  styleUrls: ['./attachment-card.component.scss'],

  templateUrl: './attachment-card.component.html',
})
export class AttachmentCardComponent {
  /**
   * The attachment's name and Id
   */
  @Input() public attachmentId!: string;
  @Input() public attachmentName!: string;

  /**
   * Determines whether or not the attachment's preview is shown. Default value is false.
   */
  @Input() public preview = false;
  @Input() public previewSource!: unknown;

  @Output() public readonly downloadRequested = new EventEmitter<string>();

  public requestDownload() {
    this.downloadRequested.emit(this.attachmentId);
  }
}
