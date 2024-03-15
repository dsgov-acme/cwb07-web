import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LoggingService } from '@dsg/shared/utils/logging';
import { render } from '@testing-library/angular';
import { MockBuilder, MockService } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { INuverialNavBarMenuItem } from '../../models';
import { NuverialSideNavMenuComponent } from './side-nav-menu.component';

const dependencies = MockBuilder(NuverialSideNavMenuComponent).keep(MatSidenavModule).keep(MatListModule).keep(CommonModule).build();

const NAV_BAR_MENU_OPTIONS: INuverialNavBarMenuItem[] = [
  {
    icon: 'language',
    navigationRoute: 'dashboard',
  },
  {
    icon: 'gpp_maybe',
    navigationRoute: 'home',
  },
  {
    icon: 'space_dashboard',
    navigationRoute: 'list',
  },
];

const mockRouter = {
  events: new BehaviorSubject({}),
  navigate: jest.fn(),
  routerState: {
    snapshot: {
      root: {},
    },
  },
};

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(NuverialSideNavMenuComponent, {
    ...dependencies,
    ...props,
    providers: [
      { provide: LoggingService, useValue: MockService(LoggingService) },
      {
        provide: Router,
        useValue: mockRouter,
      },
    ],
  });

  return { fixture };
};

describe('NuverialSideNavMenuComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuverialSideNavMenuComponent],
      providers: [
        {
          provide: Router,
          useValue: mockRouter,
        },
      ],
    }).compileComponents();
  });

  it('should create', async () => {
    const { fixture } = await getFixture({});
    expect(fixture).toBeTruthy();
  });

  it('can define a default side nav menu component', async () => {
    const { fixture } = await getFixture({});

    expect(fixture).toBeTruthy();
    expect(fixture.componentInstance.navBarMenuItemList).toEqual(undefined);
    expect(fixture.componentInstance.navBarMenuBottomItem).toEqual(undefined);
  });

  it('should set navBarMenuItemList', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS } });

    fixture.detectChanges();
    expect(NAV_BAR_MENU_OPTIONS.length).toEqual(fixture.componentInstance.navBarMenuItemList?.length);
  });

  it('should default to mat menu having no elements', async () => {
    const { fixture } = await getFixture({});
    const menu: HTMLElement = fixture.debugElement.nativeElement.querySelector('mat-sidenav');
    const menuElements = menu.querySelectorAll('mat-list-item').length;
    expect(menuElements).toEqual(0);
  });

  it('should render the appropriate amount of mat sidenav menu elements', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS } });
    const sidenav: HTMLElement = fixture.debugElement.nativeElement.querySelector('mat-sidenav');
    fixture.detectChanges();

    const sidenavElements = sidenav.querySelectorAll('mat-list-item').length;
    expect(sidenavElements).toEqual(3);
  });

  it('should include home button if the option is selected', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS, navBarReturnHome: true } });
    const sidenav: HTMLElement = fixture.debugElement.nativeElement.querySelector('mat-sidenav');
    fixture.detectChanges();

    const sideNavHome = sidenav.getElementsByClassName('nav-home');
    expect(sideNavHome.length).toEqual(1);
  });

  it('should call onMenuClick on keyup.space', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS, navBarReturnHome: true } });
    const itemElement = fixture.debugElement.query(By.css('mat-list-item'));
    const spy = jest.spyOn(fixture.componentInstance, 'onHomeClick');
    expect(itemElement).toBeTruthy();
    itemElement.triggerEventHandler('keyup.space', {});
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('should call onMenuClick on keyup.enter', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS, navBarReturnHome: true } });
    const itemElement = fixture.debugElement.query(By.css('mat-list-item'));
    const spy = jest.spyOn(fixture.componentInstance, 'onHomeClick');
    expect(itemElement).toBeTruthy();
    itemElement.triggerEventHandler('keyup.enter', {});
    fixture.detectChanges();
    expect(spy).toHaveBeenCalled();
  });

  it('should navigate to the correct route when onMenuClick is called', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS } });
    const router = TestBed.inject(Router);
    const navMenuItem = { icon: 'icon', navigationRoute: '/route1', navigationSubRoute: '/subroute1' };
    const navigateSpy = jest.spyOn(router, 'navigate');

    fixture.componentInstance.onMenuClick(navMenuItem);

    expect(navigateSpy).toHaveBeenCalledWith([navMenuItem.navigationRoute + navMenuItem.navigationSubRoute]);
  });

  it('should navigate with queryParams when onMenuClick is called and there is no subRoute', async () => {
    const { fixture } = await getFixture({ componentProperties: { navBarMenuItemList: NAV_BAR_MENU_OPTIONS } });
    const router = TestBed.inject(Router);
    const navMenuItem = { icon: 'icon', navigationParams: { transactionSet: 'UnemploymentInsurance' }, navigationRoute: '/route1' };
    const navigateSpy = jest.spyOn(router, 'navigate');

    fixture.componentInstance.onMenuClick(navMenuItem);

    expect(navigateSpy).toHaveBeenCalledWith([navMenuItem.navigationRoute], { queryParams: navMenuItem.navigationParams });
  });

  it('should navigate to the navBarMenuBottomItem route when onBottomClick called', async () => {
    const navMenuItem = { icon: 'icon', navigationRoute: '/route1' };
    const { fixture } = await getFixture({ componentProperties: { navBarMenuBottomItem: NAV_BAR_MENU_OPTIONS } });
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    fixture.componentInstance.navBarMenuBottomItem = navMenuItem;

    fixture.componentInstance.onBottomClick();

    expect(navigateSpy).toHaveBeenCalledWith([navMenuItem.navigationRoute]);
  });

  it('should not navigate on onBottomClick if navBarMenuBottomItem does not exist', async () => {
    const { fixture } = await getFixture({ componentProperties: {} });
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');
    navigateSpy.mockClear();
    fixture.componentInstance.onBottomClick();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should navigate to home on onHomeClick', async () => {
    const { fixture } = await getFixture({ componentProperties: {} });
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    fixture.componentInstance.onHomeClick();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
