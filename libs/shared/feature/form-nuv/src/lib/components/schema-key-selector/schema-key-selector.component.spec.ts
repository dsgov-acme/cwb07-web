import { Renderer2 } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SchemaTreeDefinitionMock, SchemaTreeDefinitionModel } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockProvider, ngMocks } from 'ng-mocks';
import { ReplaySubject, of } from 'rxjs';
import { SchemaTreeService } from '../../services';
import { SchemaKeySelectorComponent } from './schema-key-selector.component';

describe('SchemaKeySelectorComponent', () => {
  let component: SchemaKeySelectorComponent;
  let fixture: ComponentFixture<SchemaKeySelectorComponent>;
  let schemaTreeSubject: ReplaySubject<SchemaTreeDefinitionModel>;

  beforeEach(async () => {
    schemaTreeSubject = new ReplaySubject<SchemaTreeDefinitionModel>(1);
    schemaTreeSubject.next(new SchemaTreeDefinitionModel(SchemaTreeDefinitionMock));

    await TestBed.configureTestingModule({
      imports: [SchemaKeySelectorComponent, NoopAnimationsModule],
      providers: [
        MockProvider(NuverialSnackBarService),
        MockProvider(MatDialog, {
          open: jest.fn().mockReturnValue({
            afterClosed: () => of(''),
          }),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ transactionDefinitionKey: 'FinancialBenefit' })),
          },
        },
        MockProvider(SchemaTreeService, {
          getSchemaKeySelectorSchemaTree$: jest.fn().mockImplementation(() => of(SchemaTreeDefinitionMock)),
          schemaTree$: schemaTreeSubject.asObservable(),
        }),
        MockProvider(Renderer2, {
          setStyle: jest.fn(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchemaKeySelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.props.allowedSchemaTypes = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectedSchemaKey', () => {
    it('should be empty on init', () => {
      expect(component.selectedSchemaKey).toBeFalsy();
    });
  });

  describe('ngOnInit', () => {
    it('should disable the modal if the schema tree has no key', () => {
      const service = ngMocks.findInstance(SchemaTreeService);
      jest.spyOn(service, 'getSchemaKeySelectorSchemaTree$').mockReturnValue(of(new SchemaTreeDefinitionModel()));

      component.ngOnInit();

      expect(component.disabled).toBe(true);
    });
  });

  describe('value setter', () => {
    it('should call setSelectedSchemaKey with null if disabled', () => {
      const spy = jest.spyOn(component, 'setSelectedSchemaKey');
      component.disabled = true;
      component.value = 'FinancialBenefit';

      expect(spy).toHaveBeenCalledWith(null);
    });

    it('should call setSelectedSchemaKey with empty string if value is falsey', () => {
      const spy = jest.spyOn(component, 'setSelectedSchemaKey');
      component.disabled = false;
      component.value = '';
      expect(spy).toHaveBeenCalledWith('');
      component.value = null;
      expect(spy).toHaveBeenCalledWith('');
    });

    it('should set the selectedSchemaKey to the value if it exists in the schema', () => {
      const spy = jest.spyOn(component, 'setSelectedSchemaKey');
      component.disabled = false;
      component.value = 'firstName';

      expect(spy).toHaveBeenCalledWith('firstName');
    });

    it('should not set the selectedSchemaKey to the value if does not exist in the schema', () => {
      const spy = jest.spyOn(component, 'setSelectedSchemaKey');
      component.disabled = false;
      component.value = 'notAKey';

      expect(spy).not.toHaveBeenCalledWith('notAKey');
    });
  });

  describe('setSelectedSchemaKey', () => {
    it('should be set selectedSchemaKey to falsy value when called', () => {
      component.selectedSchemaKey = 'some key';
      expect(component.selectedSchemaKey).toBe('some key');

      component.setSelectedSchemaKey('');
      expect(component.selectedSchemaKey).toBeFalsy();
    });
  });

  describe('_verifySchemaKeyType', () => {
    it('should return true if the key is of the allowed type', () => {
      component.props.allowedSchemaTypes = ['String'];
      const result = component['_verifySchemaKeyType']('CommonPersonalInformation.city');

      expect(result).toBe(true);
    });

    it('should return false if the key is not of the allowed type', () => {
      component.props.allowedSchemaTypes = ['Integer'];
      const result = component['_verifySchemaKeyType']('CommonPersonalInformation.city');

      expect(result).toBe(false);
    });
  });

  describe('openModal', () => {
    it('dialog should open and set the returned key', async () => {
      expect(component.selectedSchemaKey).toBeFalsy();

      const spy = jest.spyOn(component['_dialog'], 'open').mockReturnValue({ afterClosed: () => of('FinancialBenefit') } as MatDialogRef<unknown, unknown>);
      component.openModal();

      expect(spy).toHaveBeenCalled();
      expect(component.selectedSchemaKey).toBe('FinancialBenefit');
    });

    it('should not call setSelectedSchemaKey if dialog responds with empty string', async () => {
      const emptyKey = '';
      const service = ngMocks.findInstance(MatDialog);
      jest.spyOn(service, 'open').mockReturnValue({
        afterClosed: () => of(emptyKey),
      } as MatDialogRef<unknown, unknown>);

      const spy = jest.spyOn(component, 'setSelectedSchemaKey');
      component.openModal();

      await component.dialogRef?.afterClosed().toPromise();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call setSelectedSchemaKey with the key after the dialog is closed', async () => {
      const key = 'key';
      const service = ngMocks.findInstance(MatDialog);
      jest.spyOn(service, 'open').mockReturnValue({
        afterClosed: () => of(key),
      } as MatDialogRef<unknown, unknown>);

      const spy = jest.spyOn(component, 'setSelectedSchemaKey');
      component.openModal();

      await component.dialogRef?.afterClosed().toPromise();
      expect(spy).toHaveBeenCalledWith(key);
    });

    it('should do nothing if disabled is true', async () => {
      component.disabled = true;

      const spy = jest.spyOn(component['_dialog'], 'open');
      component.openModal();

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
