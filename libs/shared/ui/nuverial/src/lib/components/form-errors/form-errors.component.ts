import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NuverialIconComponent } from './../icon/icon.component';
import { IFormError } from './form-errors.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialIconComponent],
  selector: 'nuverial-form-errors',
  standalone: true,
  styleUrls: ['./form-errors.component.scss'],
  templateUrl: './form-errors.component.html',
})
export class NuverialFormErrorsComponent implements OnInit, OnChanges, AfterViewInit {
  @HostBinding('attr.role') public get ariaRole(): 'alert' | null {
    return this.formErrors.length ? 'alert' : null;
  }

  @Input() public formErrors: IFormError[] = [];

  public showMore = false;

  public displayedErrors: IFormError[] = [];

  constructor() {
    this.displayErrors();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes['formErrors'] && !changes['formErrors'].isFirstChange()) {
      this.displayErrors();
      const formErrorsElement = document.querySelector<HTMLElement>('nuverial-form-errors');
      formErrorsElement?.focus();
    }
  }

  public ngAfterViewInit(): void {
    const formErrorsElement = document.querySelector<HTMLElement>('nuverial-form-errors');
    formErrorsElement?.focus();
  }

  public displayErrors() {
    if (this.formErrors.length <= 3 || this.showMore) {
      this.displayedErrors = this.formErrors;
    } else {
      this.displayedErrors = this.formErrors.slice(0, 3);
    }
  }

  public trackByFn(index: number) {
    return index;
  }

  public toggleShowMore() {
    this.showMore = !this.showMore;
    this.displayErrors();
    const errorListElement = document.querySelector<HTMLElement>('.form-errors-list-container');
    errorListElement?.focus();
  }

  public ngOnInit() {
    this.displayErrors();
  }

  public handleFocus(formError: IFormError): void {
    if (!formError.id) return;

    const queryString = `#${formError.id.replace(/\./g, '\\.')}`;
    const inputElement =
      document.querySelector<HTMLInputElement>(`${queryString} input`) ?? document.querySelector<HTMLInputElement>(`${queryString} textarea`);

    inputElement?.type === 'file' ? inputElement.click() : inputElement?.focus();
  }
}
