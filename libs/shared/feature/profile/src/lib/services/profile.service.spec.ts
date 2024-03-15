import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { UserMock } from '@dsg/shared/data-access/user-api';
import { UserStateService } from '@dsg/shared/feature/app-state';
import { AuthenticationService, IAuthenticatedUser } from '@dsg/shared/feature/authentication';
import { HttpTestingModule } from '@dsg/shared/utils/http';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { ProfileService } from './profile.service';

const IAuthenticatedUserMock: IAuthenticatedUser = {
  displayName: 'Test',
  email: 'test@email.com',
  phoneNumber: '(123)456-7890',
  photoURL: 'testUrl',
  providerId: 'testId',
  uid: '12481924910284',
};

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpTestingModule],
      providers: [
        MockProvider(HttpClient),
        MockProvider(LoggingService),
        MockProvider(UserStateService, {
          user$: of(UserMock),
          saveUser$: jest.fn().mockImplementation(() => of(UserMock)),
        }),
        MockProvider(AuthenticationService, {
          user$: of(IAuthenticatedUserMock),
        }),
      ],
    });

    service = TestBed.inject(ProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update user profile', () => {
    const userStateService = ngMocks.findInstance(UserStateService);
    const spy = jest.spyOn(userStateService, 'saveUser$');
    const payload = UserMock;

    const result = service.createUpdateProfile$(payload);
    expect(spy).toBeCalledWith(payload);
    expect(JSON.stringify(result)).toBe(JSON.stringify(of(UserMock)));
  });

  it('should return user ID', () => {
    const result = service.getUserId$();
    expect(JSON.stringify(result)).toBe(JSON.stringify(of(IAuthenticatedUserMock)));
  });

  it('should get user profile', () => {
    const result = service.getProfile$();
    expect(JSON.stringify(result)).toBe(JSON.stringify(of(UserMock)));
  });
});
