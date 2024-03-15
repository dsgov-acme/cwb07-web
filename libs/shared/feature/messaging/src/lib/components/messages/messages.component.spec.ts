import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Mock, createMock } from '@testing-library/angular/jest-utils';

import { ChangeDetectorRef } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { ConversationsPaginatedResponseMock } from '@dsg/shared/data-access/work-api';
import { LoadingTestingModule, NuverialIconComponent, NuverialSnackBarService, NuverialTagComponent } from '@dsg/shared/ui/nuverial';
import { AccessControlModule, AccessControlService } from '@dsg/shared/utils/access-control';
import { HttpTestingModule, PagingRequestModel } from '@dsg/shared/utils/http';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MockProvider, ngMocks } from 'ng-mocks';
import { ReplaySubject, Subject, of, throwError } from 'rxjs';
import { MessagingService } from '../../services';
import { MessagesComponent } from './messages.component';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;
  let pagingRequestModel: PagingRequestModel;
  let isAuthorized$: Subject<boolean>;
  let accessControlService: Mock<AccessControlService>;

  beforeEach(async () => {
    accessControlService = createMock(AccessControlService);
    isAuthorized$ = new ReplaySubject(1);
    accessControlService.isAuthorized$.mockReturnValue(isAuthorized$);

    await TestBed.configureTestingModule({
      imports: [
        HttpTestingModule,
        AccessControlModule,
        MessagesComponent,
        NuverialIconComponent,
        NoopAnimationsModule,
        NuverialTagComponent,
        LoadingTestingModule,
      ],
      providers: [
        { provide: AccessControlService, useValue: accessControlService },
        MockProvider(MessagingService, {
          getConversations$: jest.fn().mockImplementation(() => of(ConversationsPaginatedResponseMock)),
        }),
        MockProvider(ChangeDetectorRef),
        MockProvider(NuverialSnackBarService),
        MockProvider(ActivatedRoute),
        MockProvider(Router),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    pagingRequestModel = new PagingRequestModel({
      pageSize: 15,
      sortBy: 'createdTimestamp',
      sortOrder: 'DESC',
    });
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

  it('should load conversations', () => {
    const conversations = fixture.debugElement.queryAll(By.css('.conversation'));
    expect(conversations.length).toBe(1);
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should handle error when loading conversations', () => {
      pagingRequestModel.pageNumber = 1;
      const service = ngMocks.findInstance(MessagingService);
      const spy = jest.spyOn(service, 'getConversations$').mockImplementation(() => throwError(() => new Error()));
      const snackService = ngMocks.findInstance(NuverialSnackBarService);
      const errorSpy = jest.spyOn(snackService, 'notifyApplicationError');

      component.loadMoreConversations();

      expect(spy).toHaveBeenCalledWith([], pagingRequestModel);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it('should render the new message button if user is authorized', async () => {
    isAuthorized$.next(true);

    fixture.detectChanges();

    const addMessageButton = fixture.debugElement.query(By.css('nuverial-button[ariaLabel="New Message"]'));
    expect(addMessageButton).not.toBeNull();
    expect(addMessageButton.nativeElement.textContent).toContain('New Message');
  });

  it('should not render the new message button if user is unauthorized', () => {
    isAuthorized$.next(false);

    fixture.detectChanges();

    const addMessageButton = fixture.debugElement.query(By.css('nuverial-button[ariaLabel="New Message"]'));
    expect(addMessageButton).toBeNull();
  });

  it('should navigate to a new message', () => {
    const route = ngMocks.findInstance(ActivatedRoute);
    const router = ngMocks.findInstance(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    component.goToNewMessage();

    expect(navigateSpy).toHaveBeenCalledWith(['new-message'], { relativeTo: route });
  });

  it('should navigate to a conversation', () => {
    const route = ngMocks.findInstance(ActivatedRoute);
    const router = ngMocks.findInstance(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    const conversationId = '123-456-879';

    component.goToConversation(conversationId);

    expect(navigateSpy).toHaveBeenCalledWith(['conversation', conversationId], { relativeTo: route });
  });
});
