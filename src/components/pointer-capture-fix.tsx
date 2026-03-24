'use client';

import { useEffect } from 'react';

/**
 * Patches Element.prototype.releasePointerCapture to suppress
 * "No active pointer with the given id" errors thrown by @base-ui/react
 * Select on touch devices.
 */
export function PointerCaptureFix() {
  useEffect(() => {
    const original = Element.prototype.releasePointerCapture;
    Element.prototype.releasePointerCapture = function (pointerId: number) {
      try {
        original.call(this, pointerId);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'NotFoundError') {
          // Silently ignore — pointer was already released
          return;
        }
        throw e;
      }
    };
    return () => {
      Element.prototype.releasePointerCapture = original;
    };
  }, []);

  return null;
}
