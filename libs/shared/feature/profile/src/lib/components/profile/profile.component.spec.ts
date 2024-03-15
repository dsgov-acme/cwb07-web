import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { UserMock } from '@dsg/shared/data-access/user-api';
import { NuverialSnackBarService, TitleService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { Validators } from 'ngx-editor';
import { of, throwError } from 'rxjs';
import { ProfileService } from '../../services';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, NoopAnimationsModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile$: jest.fn().mockImplementation(() => of(UserMock)),
          createUpdateProfile$: jest.fn().mockImplementation(() => of(UserMock)),
        }),
        MockProvider(NuverialSnackBarService),
        MockProvider(ActivatedRoute),
        MockProvider(Router),
        MockProvider(TitleService),
        MockProvider(LoggingService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Accessability', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect.extend(toHaveNoViolations);
      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);

    expect(results).toEqual(1);
  });

  it('should navigate to dashboard', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    component.goToDashboard();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  describe('communicationMethodChange', () => {
    it('should enable agreement control when communication method is sms', () => {
      const smsAgreementControl = new FormControl(false);
      const inputTextFormGroup = new FormGroup({
        smsAgreement: smsAgreementControl,
      });
      component.inputTextFormGroup = inputTextFormGroup;

      component.communicationMethodChange({ checked: true, value: 'sms' });

      expect(smsAgreementControl.enabled).toBeTruthy();
    });

    it('should disable agreement control when communication method is not sms', () => {
      const smsAgreementControl = new FormControl(true);
      const inputTextFormGroup = new FormGroup({
        smsAgreement: smsAgreementControl,
      });
      component.inputTextFormGroup = inputTextFormGroup;

      component.communicationMethodChange({ checked: true, value: 'email' });

      expect(smsAgreementControl.disabled).toBeTruthy();
    });

    it('should not change agreement control when inputTextFormGroup is undefined', () => {
      component.inputTextFormGroup = undefined;
      component.communicationMethodChange({ checked: true, value: 'sms' });
      expect(component.inputTextFormGroup).toBeUndefined();
      component.communicationMethodChange({ checked: true, value: 'email' });
      expect(component.inputTextFormGroup).toBeUndefined();
    });
  });

  describe('saveProfile', () => {
    it('should set form errors and mark controls as touched when form is invalid', () => {
      const formGroup: FormGroup = new FormGroup({
        firstName: new FormControl('', Validators.required),
      });
      component.inputTextFormGroup = formGroup;

      component.saveProfile();
      expect(component.inputTextFormGroup.controls['firstName'].touched).toBeTruthy();
    });

    it('should update profile', () => {
      const mockFormValue = {
        firstName: 'John',
        middleName: 'Doe',
        lastName: 'Smith',
        phoneNumber: '1234567890',
        communicationMethod: 'email',
      };
      const formGroup: FormGroup = new FormGroup({
        firstName: new FormControl(mockFormValue.firstName),
        middleName: new FormControl(mockFormValue.middleName),
        lastName: new FormControl(mockFormValue.lastName),
        phoneNumber: new FormControl(mockFormValue.phoneNumber),
        communicationMethod: new FormControl(mockFormValue.communicationMethod),
      });
      component.inputTextFormGroup = formGroup;
      const profileService = ngMocks.findInstance(ProfileService);
      const spy = jest.spyOn(profileService, 'createUpdateProfile$');

      component.saveProfile();
      expect(spy).toBeCalled();
      expect(component.userModel).toEqual(UserMock);
    });

    it('should catch and handle error', () => {
      const profileService = ngMocks.findInstance(ProfileService);
      const spy = jest.spyOn(profileService, 'createUpdateProfile$').mockReturnValue(throwError(() => new Error('Test error')));
      const snackBarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackBarSpy = jest.spyOn(snackBarService, 'openConfigured');
      component.saveProfile();
      expect(spy).toBeCalled();
      expect(snackBarSpy).toBeCalled();
    });

    it('should not change userModel when inputTextFormGroup is undefined', () => {
      component.inputTextFormGroup = undefined;
      const user = component.userModel;
      const profileService = ngMocks.findInstance(ProfileService);
      const spy = jest.spyOn(profileService, 'createUpdateProfile$');
      component.saveProfile();
      expect(spy).toBeCalledWith(user);
    });
  });
});
