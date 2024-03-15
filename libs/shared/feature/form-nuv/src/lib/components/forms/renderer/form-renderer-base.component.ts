import { Directive, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TransactionData } from '@dsg/shared/data-access/work-api';
import { UnsavedChangesService } from '@dsg/shared/ui/nuverial';
import { map, Observable } from 'rxjs';
import { FormRendererService } from '../../../services/form-renderer.service';

// base components are decorated with @Directive()
@Directive()
export class FormRendererBaseComponent {
  /** The form data model */
  @Input() public model$?: Observable<TransactionData> = this._formRendererService.transaction$.pipe(map(transactionModel => transactionModel.data));

  /** Output event emitter for model changes */
  @Output() public readonly modelChange = new EventEmitter<TransactionData>();

  /** The form group */
  public form = new FormGroup({});

  constructor(protected readonly _formRendererService: FormRendererService, protected readonly _unsavedChangesService: UnsavedChangesService) {}

  public onModelChange(_event: TransactionData) {
    this._unsavedChangesService.model = _event;
    this.modelChange?.emit(_event);
  }
}
