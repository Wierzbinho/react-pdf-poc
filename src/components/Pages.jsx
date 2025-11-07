import { Page } from 'react-pdf';
import { useSearch } from '../context/SearchContext.jsx';

const BASE_PAGE_WIDTH = 780;

export default function Pages({ numPages, zoom, rotation, pageRefs }) {
  const { textRenderersByPage } = useSearch();
  return (
    <section className="pdf-pages" aria-label="Document pages">
      {Array.from({ length: numPages ?? 0 }, (_, index) => {
        const pageNumber = index + 1;
        const customTextRenderer = textRenderersByPage.get(pageNumber);

        return (
          <div
            className="pdf-page"
            key={`page_${pageNumber}`}
            data-page={pageNumber}
            ref={(element) => {
              if (pageRefs?.current) {
                pageRefs.current[index] = element ?? null;
              }
            }}
          >
            <Page
              className="pdf-page-content"
              pageNumber={pageNumber}
              width={BASE_PAGE_WIDTH * zoom}
              renderTextLayer
              customTextRenderer={customTextRenderer}
              renderAnnotationLayer={false}
              rotate={rotation}
            />
          </div>
        );
      })}
    </section>
  );
}
