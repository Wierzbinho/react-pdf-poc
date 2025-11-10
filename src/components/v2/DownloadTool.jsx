import { useRef } from 'react';
import { useDocument } from '../../context/DocumentContext.jsx';
import { SAMPLE_PDF_URL } from '../../constants/pdf.js';

export default function DownloadTool() {
  const { numPages } = useDocument();
  const isDownloadingRef = useRef(false);

  const handleClick = async () => {
    if (!numPages || isDownloadingRef.current) {
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
    <button type="button" onClick={handleClick} disabled={!numPages}>
      Download
    </button>
  );
}
