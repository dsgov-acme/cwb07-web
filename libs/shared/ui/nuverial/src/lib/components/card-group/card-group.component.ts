import { FocusMonitor } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Inject,
  Injector,
  Input,
  OnDestroy,
  Output,
  QueryList,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ValidatorFn, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, Subject } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { FormInputBaseDirective } from '../../common';
import { Card, CardChange, NuverialCardCommonComponent } from '../../directives';
import { NuverialFormFieldErrorComponent } from '../form-field-error';
import { NuverialIconComponent } from '../icon';
import { CardGroupPointChange } from './card-group.models';

/**
 * The Card Group component acts as controlling component for the CheckboxCardComponent or RadioCardComponent components.
 *
 * It uses a points based system, where each card is assigned a point value, to determine the validity of the cards under its control.
 *
 * Multiple event streams are generated by the Card Group allowing an application developer to determine the state of the Card Group and
 * its underlying cards. This allows validation logic to be performed either by the Card Group or application code. Note that Card Group
 * validation functionality will be executed performed if the optional NgControl is provided.
 *
 * ### Validation
 *
 * If enabled, the Card Group component uses the validation rules Validation.required, Validation.min & Validation.max. Note that any
 * validation rules defined within an input NgModel will be removed and replaced with the Card Group component rules. This is primarily
 * due to restrictions with Angular Forms that limit the modification of existing rules.
 *
 * ### Checkbox Cards
 *
 * The Card Group uses minimumPoints & maximumPoints together with the sum of all the selected Checkbox Cards point values to determine
 * a valid state. This approach offers a great deal of flexibility when determining how many cards a user may select.
 *
 * ### Radio Cards
 *
 * Radio cards allow the selection of a single card from a groups of cards and therefore require a controlling component to function correctly.
 * A point value maybe applied to a card but is not used to determine the validity of the Card Group.
 *
 * When using radio cards, the card group component will be assigned the role of 'radiogroup'. The use of the aria-labelledby attribute will
 * allow screen readers to announce radio cards with in the context of the card group e.g.
 *
 * ```html
 * <div id="test-label-radio">Pick a card!</div>
 * <nuverial-card-group aria-labelledby="test-label-radio">
 *   <nuverial-radio-card value="card-2" [pointValue]="1">
 *     <div nuverialCardContent>Radio option 2</div>
 *   </nuverial-radio-card>
 * </nuverial-card-group>
 * ```
 * Usage
 *
 * The following show an example using instances of the Radio Card Component that can be substituted for the Checkbox Card Component
 *
 * ```ts
 * import { NuverialCardGroupComponent, } from '@dsg/shared/ui/nuverial';
 * import { NuverialCheckboxCardComponent } from '@dsg/shared/ui/nuverial';
 * import { NuverialCardContentDirective } from '@dsg/shared/ui/nuverial';
 * import { NuverialRadioCardComponent } from '@dsg/shared/ui/nuverial';
 * ```
 * ```html
 * <nuverial-card-group
 *   [(ngModel)]="formModel.isValid"
 *   [minimumPoints]="0"
 *   [maximumPoints]="0"
 *   (changeCard)="onCardChange($event)"
 *   (changePoints)="onChangePoints($event)"
 *   (validationErrors)="onValidationErrors($event)">
 *   <nuverial-radio-card value="card-1" [pointValue]="1">
 *     <div nuverialCardContent>Radio option 1</div>
 *   </nuverial-radio-card>
 *   <nuverial-radio-card value="card-2" [pointValue]="1">
 *     <div nuverialCardContent>Radio option 2</div>
 *   </nuverial-radio-card>
 * </nuverial-card-group>
 * ```
 */
@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialFormFieldErrorComponent, NuverialIconComponent],
  providers: [
    {
      multi: true,
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NuverialCardGroupComponent),
    },
  ],
  selector: 'nuverial-card-group',
  standalone: true,
  styleUrls: ['./card-group.component.scss'],
  templateUrl: './card-group.component.html',
})
export class NuverialCardGroupComponent extends FormInputBaseDirective implements AfterViewInit, ControlValueAccessor, OnDestroy {
  /**
   * CardGroups aria label. Default value null.
   */
  @Input('aria-labelledby') public ariaLabelledby: string | null = null;
  /**
   * Group is required indicator
   */
  @Input() public required = false;
  /**
   * CardGroups maximum point value. Default value 0.
   */
  @Input() public maxPoints = 0;
  /**
   * CardGroups minimum point value. Default value 0.
   */
  @Input() public minPoints = 0;
  /**
   * CardGroup grid columns
   */
  @Input() public columns?: number;
  /**
   * CardGroup's output change event for all cards
   */
  @Output() public readonly change = new EventEmitter<CardChange[]>();

  /**
   * Card change output change event from child card
   */
  @Output() public readonly changeCard = new EventEmitter<CardChange>();

  /**
   * Card Group point change output
   */
  @Output() public readonly changePoints = new EventEmitter<CardGroupPointChange>();
  @ContentChildren(NuverialCardCommonComponent) protected _cards!: QueryList<Card>;

  /**
   * @ignore
   */
  protected _validateEvent: Subject<boolean> = new Subject<boolean>();

  @HostBinding('class.nuverial-card-group') public componentClass = true;
  @HostBinding('attr.role') public ariaRole: 'radiogroup' | null = null;

  constructor(
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _elementRef: ElementRef,
    protected readonly _focusMonitor: FocusMonitor,
    @Inject(Injector) protected override readonly _injector: Injector,
  ) {
    super();
    this._ngControl && (this._ngControl.valueAccessor = this);
  }

  public ngAfterViewInit() {
    this.formControl = this._modelFormControl();

    // This is unfortunate. Cannot determine what rules the form control has and adding validation
    // rules does not help i.e. if min already exists this adding creates another min validator
    if (this.formControl) {
      const validators: ValidatorFn[] = [];
      this.formControl.clearValidators();
      this.required && validators.push(Validators.required);
      this.minPoints > 0 && validators.push(Validators.min(this.minPoints));
      this.maxPoints > 0 && validators.push(Validators.max(this.maxPoints));
      this.formControl.setValidators(validators);
    }

    // Need to initiate validation error handling based on an invalid for or blur event.
    this._initErrorHandler(
      combineLatest([this._focusMonitor.monitor(this._elementRef, true), this._validateEvent.pipe(startWith(false))]).pipe(
        map(([event, status]) => (!event || typeof status === 'boolean' ? null : 'ignore')),
      ),
    );

    this._cards.forEach(card => this._cardLoadingConfig(card));

    this.error$ &&
      this.error$
        .pipe(
          tap(error => {
            this._cards.forEach(card => {
              if (card.cardType === 'checkbox') {
                card.invalid = !!error;
              }
              card.markForCheck();
            });
          }),
          untilDestroyed(this),
        )
        .subscribe();

    this._changeDetectorRef.detectChanges();
  }

  private _cardLoadingConfig(card: Card) {
    card.formControl = this.formControl;
    if (card.cardType === 'radio') {
      this.ariaRole = 'radiogroup';
      if (this.formControl.value == card.value) {
        card.checked = true;
      }
    }
    card.change
      .pipe(
        tap(event => (card.cardType === 'checkbox' ? this._updateSelectedCheckboxCard(card, event) : this._updateSelectedRadioCard(card, event))),
        untilDestroyed(this),
      )
      .subscribe();
  }

  public ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  protected _updateSelectedCheckboxCard(selectedCard: Card, event: CardChange) {
    let pointsTotal = event && event.checked && event.pointValue ? event.pointValue : 0;
    const events: CardChange[] = this._cards.toArray().map(card => {
      selectedCard.inputId === card.inputId && (card.checked = event.checked);
      card.checked && selectedCard.inputId !== card.inputId && (pointsTotal += card.pointValue);

      return {
        checked: card.checked,
        pointValue: card.pointValue,
        value: card.value,
      };
    });

    if (this.formControl) {
      this.formControl.setValue(pointsTotal > 0 ? pointsTotal : null);
      this.formControl.updateValueAndValidity();
      this._validateEvent.next(this.formControl.valid);
    }
    this.changePoints.next({ currentPoints: pointsTotal, maxPoints: this.maxPoints, minPoints: this.minPoints });
    this.change.emit(events);
  }

  protected _updateSelectedRadioCard(selectedCard: Card, event: CardChange) {
    // Check for invalidity caused by blur and re-set
    if (this.formControl && this.formControl.invalid) {
      this._cards.forEach(card => {
        card.markForCheck();
        this.formControl.updateValueAndValidity();
        this._validateEvent.next(this.formControl.valid);
      });
    }
    this.formControl && this.formControl.setValue(event.value);
    const events: CardChange[] = this._cards.map(card => {
      card.checked = selectedCard.inputId === card.inputId;

      card.checked && this.changePoints.next({ currentPoints: card.pointValue, maxPoints: this.maxPoints, minPoints: this.minPoints });

      return {
        checked: card.checked,
        pointValue: card.pointValue,
        value: card.value,
      };
    });
    this.changeCard.emit(event);
    this.change.emit(events);
  }
}
