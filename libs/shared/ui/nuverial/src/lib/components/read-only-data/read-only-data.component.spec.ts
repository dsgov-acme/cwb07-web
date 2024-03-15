import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedUtilsLoggingModule } from '@dsg/shared/utils/logging';
import { axe } from 'jest-axe';
import { NuverialReadOnlyDataComponent } from './read-only-data.component';

describe('ReadOnlyDataComponent', () => {
  let component: NuverialReadOnlyDataComponent;
  let fixture: ComponentFixture<NuverialReadOnlyDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuverialReadOnlyDataComponent, SharedUtilsLoggingModule.useConsoleLoggingAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(NuverialReadOnlyDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no accessibility violations', async () => {
    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });

  describe('flexStyle', () => {
    it('should return the correct flex styles', () => {
      let flexStyle;

      component.valuePosition = 'right';
      flexStyle = component.flexStyle;
      expect(flexStyle).toEqual({ 'align-items': 'center', 'flex-direction': 'row' });

      component.valuePosition = 'above';
      flexStyle = component.flexStyle;
      expect(flexStyle).toEqual({ 'align-items': 'flex-start', 'flex-direction': 'column-reverse' });

      component.valuePosition = 'below';
      flexStyle = component.flexStyle;
      expect(flexStyle).toEqual({ 'align-items': 'flex-start', 'flex-direction': 'column' });
    });
  });
});
