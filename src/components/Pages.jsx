import { Page } from 'react-pdf';

export default function Pages({ numPages, zoom, rotation, pageRefs, basePageWidth, textRenderersByPage }) {
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
              width={basePageWidth * zoom}
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
