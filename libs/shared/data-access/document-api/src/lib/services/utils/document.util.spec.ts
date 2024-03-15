import { HttpResponse } from '@angular/common/http';
import { DocumentMock, DocumentModel, IDocumentSchema } from '../../models';
import { DocumentUtil } from './document.util';

const file = new File(['data'], 'test file', { type: 'text/plain' });

describe('document utils', () => {
  describe('getEventResponse', () => {
    it('should return DocumentModel when event type is HttpEventType.Response', () => {
      const event: HttpResponse<IDocumentSchema> = new HttpResponse<IDocumentSchema>({ body: DocumentMock });

      const result = DocumentUtil.getEventResponse(event);

      expect(result).toEqual(new DocumentModel(DocumentMock));
    });

    it('should return progress percentage when event has total', () => {
      const event: ProgressEvent = new ProgressEvent('test', { loaded: 10, total: 10 });
      const result = DocumentUtil.getEventResponse(event);
      expect(result).toBe(100);
    });
  });

  describe('createFormData', () => {
    it('should create FormData object with file appended', () => {
      const mockFile: File = new File(['fileContent'], 'fileName.txt', { type: 'text/plain' });

      const formData = DocumentUtil.createFormData(mockFile);

      expect(formData instanceof FormData).toBeTruthy();
      expect(formData.get('file')).toEqual(mockFile);
    });
  });

  describe('setImagePreview', () => {
    it('should return if file size is 0', async () => {
      const readDataSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
      DocumentUtil.setImagePreview({ ...file, size: 0 }, () => {
        return;
      });
      expect(readDataSpy).not.toHaveBeenCalled();
    });

    it('should set image if file has size larger than 0', async () => {
      const readDataSpy = jest.spyOn(FileReader.prototype, 'readAsDataURL');
      DocumentUtil.setImagePreview(file, () => {
        return;
      });
      expect(readDataSpy).toHaveBeenCalled();
    });
  });
});
