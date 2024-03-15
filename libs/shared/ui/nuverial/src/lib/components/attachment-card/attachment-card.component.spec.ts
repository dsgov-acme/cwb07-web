import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AttachmentCardComponent } from './attachment-card.component';

describe('AttachmentCardComponent', () => {
  let component: AttachmentCardComponent;
  let fixture: ComponentFixture<AttachmentCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AttachmentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Accessability', () => {
    it('should have no violations', async () => {
      const axeResults = await axe(fixture.nativeElement);
      expect.extend(toHaveNoViolations);
      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should emit downloadRequested event when requestDownload is called', () => {
    const attachmentId = 'attachment1';
    component.attachmentId = attachmentId;

    const emittedValue: string[] = [];
    component.downloadRequested.subscribe((id: string) => {
      emittedValue.push(id);
    });

    component.requestDownload();

    expect(emittedValue).toEqual([attachmentId]);
  });

  it('should call requestDownload on clicking link for default view', () => {
    const spy = jest.spyOn(component, 'requestDownload');
    component.attachmentId = 'test Id';
    component.attachmentName = 'test Name';
    const element = fixture.debugElement.query(By.css('.attachment__default a'));
    const event = new MouseEvent('click');
    element.nativeElement.dispatchEvent(event);
    expect(spy).toBeCalled();
  });
});
