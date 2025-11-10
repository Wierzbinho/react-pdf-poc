import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './ViewerV2.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Toolbar from './v2/Toolbar.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const SAMPLE_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

export default function ViewerV2() {
  const [numPages, setNumPages] = useState(null);
  const isDownloadingRef = useRef(false);

  const handleDownloadDocument = async () => {
    if (isDownloadingRef.current || !numPages) {
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
    <>
      <Toolbar onDownload={handleDownloadDocument} downloadDisabled={!numPages} />
      <Document
        file={SAMPLE_PDF_URL}
        onLoadSuccess={({ numPages: nextNumPages }) => setNumPages(nextNumPages)}
        className={'pdf-viewer__document'}
      >
        {Array.from({ length: numPages ?? 0 }, (_, index) => {
          const pageNumber = index + 1;
          return <Page key={`page_${pageNumber}`} pageNumber={pageNumber} />;
        })}
      </Document>
    </>
  );
}
