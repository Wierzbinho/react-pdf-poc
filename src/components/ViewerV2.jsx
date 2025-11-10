import { Document, Page, pdfjs } from 'react-pdf';
import './ViewerV2.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Toolbar from './v2/Toolbar.jsx';
import { DocumentProvider, useDocument } from '../context/DocumentContext.jsx';
import { SAMPLE_PDF_URL } from '../constants/pdf.js';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export default function ViewerV2() {
  return (
    <DocumentProvider>
      <ViewerV2Content />
    </DocumentProvider>
  );
}

function ViewerV2Content() {
  const { numPages, setNumPages } = useDocument();

  return (
    <>
      <Toolbar />
      <Document
        file={SAMPLE_PDF_URL}
        onLoadSuccess={({ numPages: nextNumPages }) => setNumPages(nextNumPages)}
        className="pdf-viewer__document"
      >
        {Array.from({ length: numPages ?? 0 }, (_, index) => {
          const pageNumber = index + 1;
          return <Page key={`page_${pageNumber}`} pageNumber={pageNumber} />;
        })}
      </Document>
    </>
  );
}
