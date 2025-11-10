import { useCallback, useRef } from 'react';
import { useDocument } from '../context/DocumentContext.jsx';
import { SAMPLE_PDF_URL } from '../constants/pdf.js';

export function usePrint() {
  const { numPages } = useDocument();
  const isPrintingRef = useRef(false);

  const print = useCallback(async () => {
    if (!numPages || isPrintingRef.current) {
      return;
    }

    isPrintingRef.current = true;

    let iframe;
    let objectUrl;
    let fallbackTimer;

    const cleanup = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      iframe?.remove();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      isPrintingRef.current = false;
    };

    try {
      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to fetch PDF for printing.');
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');

      const handleAfterPrint = () => {
        cleanup();
        window.removeEventListener('focus', handleAfterPrint);
      };

      iframe.onload = () => {
        const targetWindow = iframe?.contentWindow;
        if (!targetWindow) {
          cleanup();
          return;
        }

        const finalize = () => {
          window.removeEventListener('focus', handleAfterPrint);
          targetWindow.removeEventListener('afterprint', finalize);
          cleanup();
        };

        targetWindow.addEventListener('afterprint', finalize, { once: true });
        window.addEventListener('focus', handleAfterPrint, { once: true });

        requestAnimationFrame(() => {
          try {
            targetWindow.focus();
            targetWindow.print();
            fallbackTimer = window.setTimeout(finalize, 60000);
          } catch (error) {
            console.error('Unable to open print dialog.', error);
            finalize();
          }
        });
      };

      iframe.onerror = () => {
        console.error('Unable to load PDF in print frame.');
        cleanup();
      };

      iframe.src = objectUrl;
      document.body.appendChild(iframe);
    } catch (error) {
      console.error(error);
      cleanup();
    }
  }, [numPages]);

  return {
    print,
    isPrinting: isPrintingRef.current,
  };
}
