import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DocumentUtil } from '@dsg/shared/data-access/document-api';
import { DocumentFormService } from '@dsg/shared/feature/documents';
import { LoadingTestingModule } from '@dsg/shared/ui/nuverial';
import { render } from '@testing-library/angular';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { AttachmentsListViewComponent } from './attachments-list-view.component';

const file = new File([], 'test.doc', { type: 'text/plain' });

describe('AttachmentsListViewComponent', () => {
  let attachments: string[];
  let component: AttachmentsListViewComponent;
  let fixture: ComponentFixture<AttachmentsListViewComponent>;

  beforeEach(async () => {
    attachments = ['12345', '67890'];
    const props = { componentProperties: { attachments: attachments, attachmentNames: { 12345: 'Doc 1', 67890: 'Doc 2' } } };
    fixture = (
      await render(AttachmentsListViewComponent, {
        ...props,
        imports: [LoadingTestingModule],
        providers: [
          MockProvider(DocumentFormService, {
            getDocumentFileDataById$: jest.fn().mockImplementation(() => of(file)),
          }),
        ],
      })
    ).fixture;

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);
    expect(results).toEqual(1);
  });

  describe('ngOnInit', () => {
    it('should call documentFormService if showPreview', done => {
      component.showPreview = true;
      component.attachments = ['12345', '67890'];
      const documentFormService = ngMocks.findInstance(DocumentFormService);
      const docSpy = jest.spyOn(documentFormService, 'getDocumentFileDataById$').mockReturnValue(of(file));
      const setImagePreviewSpy = jest.spyOn(DocumentUtil, 'setImagePreview').mockImplementation((_, callback) => {
        callback('mock result');
      });
      component.ngOnInit();

      component.filePreviews$?.subscribe(_ => {
        expect(docSpy).toBeCalledTimes(2);
        expect(setImagePreviewSpy).toBeCalledTimes(2);
        done();
      });
    });
  });

  it('should stop propagation on click', () => {
    const element = fixture.debugElement.query(By.css('.attachments__container'));
    const event = new MouseEvent('click');

    const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');
    const onClickSpy = jest.spyOn(component, 'onClick');
    element.nativeElement.dispatchEvent(event);
    expect(onClickSpy).toBeCalledWith(event);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should stop propagation on downloadFile', () => {
    const documentFormService = ngMocks.findInstance(DocumentFormService);
    jest.spyOn(documentFormService, 'downloadDocument$').mockReturnValue(of());
    const downloadSpy = jest.spyOn(component, 'downloadFile');
    const element = fixture.debugElement.query(By.css('.attachments__container nuverial-attachment-card a'));
    const event = new MouseEvent('click');

    element.nativeElement.dispatchEvent(event);
    expect(downloadSpy).toBeCalled();
  });

  it('should download file with correct name', () => {
    const documentFormService = ngMocks.findInstance(DocumentFormService);
    const documentSpy = jest.spyOn(documentFormService, 'downloadDocument$').mockReturnValue(of());
    component.attachmentNames = { testId: 'IdName' };

    component.downloadFile('testId');
    expect(documentSpy).toBeCalledWith('testId', 'IdName');
  });

  it('should download file with attachmentId if no name found', () => {
    const documentFormService = ngMocks.findInstance(DocumentFormService);
    const documentSpy = jest.spyOn(documentFormService, 'downloadDocument$').mockReturnValue(of());
    component.attachmentNames = {};

    component.downloadFile('testId');
    expect(documentSpy).toBeCalledWith('testId', 'testId');
  });

  it('should display the attachments with proper names', async () => {
    component.attachmentNames = { 12345: 'Doc 1', 67890: 'Doc 2' };
    component.attachments = ['12345', '67890'];

    fixture.detectChanges();
    const attachmentLinks = fixture.debugElement.queryAll(By.css('.attachments__container nuverial-attachment-card a'));
    const linkTexts = attachmentLinks.map(link => link.nativeElement.textContent.trim());

    expect(linkTexts[0]).toEqual('Doc 1');
    expect(linkTexts[1]).toEqual('Doc 2');
  });
});
