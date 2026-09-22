import { HttpErrorResponse } from '@angular/common/http';
import { compositionPreviewErrorKey } from './composition-preview-error-key.util';

describe('compositionPreviewErrorKey', () => {
  it('maps a known error code to the composer errors namespace', () => {
    const err = new HttpErrorResponse({ error: { error: 'SpecClassMismatch' } });

    expect(compositionPreviewErrorKey(err)).toBe('compositionPreviews.composer.errors.SpecClassMismatch');
  });

  it('falls back to the generic server error when there is no error code', () => {
    const err = new HttpErrorResponse({ error: {} });

    expect(compositionPreviewErrorKey(err)).toBe('errors.server');
  });

  it('falls back to the generic server error when the error body is null', () => {
    const err = new HttpErrorResponse({ error: null });

    expect(compositionPreviewErrorKey(err)).toBe('errors.server');
  });
});
