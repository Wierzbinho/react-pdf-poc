import { useRef } from 'react';

const SAMPLE_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

export default function DownloadTool({ disabled }) {
  const isDownloadingRef = useRef(false);

  const handleClick = async () => {
    if (disabled || isDownloadingRef.current) {
      return;
    }

    isDownloadingRef.current = true;

    let objectUrl;
    let linkElement;

    try {
      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to fetch PDF for download.');
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      linkElement = document.createElement('a');
      linkElement.href = objectUrl;
      linkElement.download = 'document.pdf';
      linkElement.style.display = 'none';
      document.body.appendChild(linkElement);
      linkElement.click();
    } catch (error) {
      console.error(error);
    } finally {
      if (linkElement) {
        document.body.removeChild(linkElement);
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      isDownloadingRef.current = false;
    }
  };

  return (
    <button type="button" onClick={handleClick} disabled={disabled}>
      Download
    </button>
  );
}
