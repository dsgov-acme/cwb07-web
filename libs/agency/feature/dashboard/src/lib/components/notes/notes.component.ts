import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EnumMapType, NoteModel } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { AttachmentsListViewComponent } from '@dsg/shared/feature/messaging';
import {
  ConfirmationModalComponent,
  ConfirmationModalReponses,
  INFINITE_SCROLL_DEFAULTS,
  INuverialSelectOption,
  LoadingService,
  NuverialAccordionComponent,
  NuverialBreadcrumbComponent,
  NuverialButtonComponent,
  NuverialIconComponent,
  NuverialPillComponent,
  NuverialRichTextViewerComponent,
  NuverialSelectorButtonDropdownComponent,
  NuverialSnackBarService,
} from '@dsg/shared/ui/nuverial';
import { PagingRequestModel, SortOrderButton, SortType } from '@dsg/shared/utils/http';
import { UntilDestroy } from '@ngneat/until-destroy';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { EMPTY, Observable, forkJoin, map, of, switchMap, take, tap } from 'rxjs';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InfiniteScrollModule,
    NuverialAccordionComponent,
    NuverialBreadcrumbComponent,
    NuverialButtonComponent,
    NuverialIconComponent,
    NuverialPillComponent,
    MatDialogModule,
    NuverialRichTextViewerComponent,
    NuverialSelectorButtonDropdownComponent,
    AttachmentsListViewComponent,
  ],
  selector: 'dsg-notes',
  standalone: true,
  styleUrls: ['./notes.component.scss'],
  templateUrl: './notes.component.html',
})
export class NotesComponent implements OnDestroy, OnInit {
  public readonly scrollEvent: EventEmitter<number> = new EventEmitter<number>();

  public notes$?: Observable<NoteModel[]>;
  public notesPagination$ = this._transactionDetailService.notesPagination$;
  public noteTypesLabels: Record<string, string> = {};
  public sortType = SortType;

  public scrollDistance = INFINITE_SCROLL_DEFAULTS.scrollDistance;
  public scrollUpDistance = INFINITE_SCROLL_DEFAULTS.scrollUpDistance;
  public throttle = INFINITE_SCROLL_DEFAULTS.throttle;

  public sortByOptions: INuverialSelectOption[] = [
    {
      disabled: false,
      displayTextValue: 'Created Date',
      key: 'createdTimestamp',
      selected: false,
    },
    {
      disabled: false,
      displayTextValue: 'Note Type',
      key: 'type',
      selected: false,
    },
    {
      disabled: false,
      displayTextValue: 'Agent',
      key: 'createdBy',
      selected: false,
    },
  ];

  public orderOptions: INuverialSelectOption[] = [
    {
      disabled: false,
      displayTextValue: 'Newest First',
      key: 'DESC',
      selected: false,
    },
    {
      disabled: false,
      displayTextValue: 'Oldest First',
      key: 'ASC',
      selected: false,
    },
  ];

  public sortByButtonText = `Sort By: ${this.sortByOptions[0].displayTextValue}`;
  public orderButtonIcon = SortOrderButton.descending;

  public attachmentNames: Record<string, Record<string, string>> = {};
  public attachmentSizes: Record<string, number> = {};

  private readonly _pagingRequestModel: PagingRequestModel = new PagingRequestModel({
    pageSize: 15, //We set to 15 so that the scrollbar shows in order to trigger the infinite scroll
    sortBy: 'createdTimestamp',
    sortOrder: 'DESC',
  });

  constructor(
    private readonly _transactionDetailService: TransactionDetailService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _router: Router,
    private readonly _dialog: MatDialog,
    private readonly _documentFormService: DocumentFormService,
    private readonly _enumsService: EnumerationsStateService,
    private readonly _loadingService: LoadingService,
  ) {}

  public ngOnInit() {
    this.notes$ = this.getNotes$().pipe(
      switchMap(() =>
        this._transactionDetailService.notes$.pipe(
          switchMap(notes => {
            const documentObservables: Array<Observable<unknown>> = [];
            for (const note of notes) {
              note.documents?.forEach(attachment => {
                documentObservables.push(
                  this._documentFormService.getDocumentById$(attachment).pipe(
                    tap(document => {
                      if (!this.attachmentNames[note.id]) {
                        this.attachmentNames[note.id] = {};
                      }
                      this.attachmentNames[note.id][attachment] = document.filename;
                      this.attachmentSizes[note.id] = Object.keys(this.attachmentNames[note.id]).length;
                    }),
                  ),
                );
              });
            }

            if (documentObservables.length === 0) {
              return of(notes);
            }

            return forkJoin(documentObservables).pipe(map(_ => notes));
          }),
        ),
      ),
    );
    this._getNoteTypesData();
  }

  public ngOnDestroy() {
    this._transactionDetailService.clearNotes();
  }

  public getNotes$(): Observable<NoteModel[]> {
    return this._loadingService.observableWithLoading$(
      this._transactionDetailService.loadNotes$(this._transactionDetailService.transactionId, this._pagingRequestModel),
    );
  }

  /* Ignored until we figure out how to mock matdialog properly to test this function */
  public deleteNote(noteId: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = { contentText: 'Are you sure you want to remove this note?', primaryAction: 'Remove' };
    dialogConfig.autoFocus = false;

    this._dialog
      .open(ConfirmationModalComponent, dialogConfig)
      .afterClosed()
      .pipe(
        take(1),
        switchMap(action => {
          if (action === ConfirmationModalReponses.PrimaryAction) {
            return this._transactionDetailService.deleteNote$(this._transactionDetailService.transactionId, noteId).pipe(
              tap(_ => {
                this._nuverialSnackBarService.notifyApplicationSuccess();
              }),
            );
          }

          return EMPTY;
        }),
      )
      .subscribe();
  }

  public editNote(noteId: string) {
    if (this._transactionDetailService.transactionId) {
      this._router.navigate(['/dashboard', 'transaction', this._transactionDetailService.transactionId, 'notes', noteId]);
    }
  }

  public loadMoreNotes() {
    if (!this._transactionDetailService.notesPagination.nextPage) return;
    this._pagingRequestModel.pageNumber += 1;
    this.getNotes$().pipe(take(1)).subscribe();
  }

  public navigateToAddNote(): void {
    if (this._transactionDetailService.transactionId) {
      this._router.navigate(['/dashboard', 'transaction', this._transactionDetailService.transactionId, 'notes', 'add-note']);
    }
  }

  public trackByFn(index: number): number {
    return index;
  }

  public changeSortBy(selectItem: INuverialSelectOption) {
    this._pagingRequestModel.sortBy = selectItem.key;
    this.sortByButtonText = `Sort By: ${selectItem.displayTextValue}`;
    this._sortNotes();
  }

  public toggleOrder() {
    switch (this.orderButtonIcon) {
      case SortOrderButton.descending:
        this.orderButtonIcon = SortOrderButton.ascending;
        this._pagingRequestModel.sortOrder = 'ASC';
        break;
      case SortOrderButton.ascending:
        this.orderButtonIcon = SortOrderButton.descending;
        this._pagingRequestModel.sortOrder = 'DESC';
    }
    this._sortNotes();
  }

  private _sortNotes() {
    this._pagingRequestModel.pageNumber = 0;
    this._transactionDetailService.clearNotes();
    this.notes$ = this.getNotes$().pipe(switchMap(_ => this._transactionDetailService.notes$));
  }

  private _getNoteTypesData() {
    this._enumsService
      .getEnumMap$(EnumMapType.NoteTypes)
      .pipe(
        take(1),
        tap(noteTypes => {
          const result: Record<string, string> = {};
          for (const [key, value] of noteTypes.entries()) {
            result[key] = value.label;
          }
          this.noteTypesLabels = result;
        }),
      )
      .subscribe();
  }
}
