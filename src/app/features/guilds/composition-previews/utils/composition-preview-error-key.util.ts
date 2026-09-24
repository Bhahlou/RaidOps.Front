import { HttpErrorResponse } from '@angular/common/http';

/** Resolves a failed composition-preview API call to its translated error key, falling back to the generic server error. */
export function compositionPreviewErrorKey(err: HttpErrorResponse): string {
  const code = (err.error as { error?: string } | null)?.error;
  return code ? `compositionPreviews.composer.errors.${code}` : 'errors.server';
}
