import { Thumbnail } from 'react-pdf';

export default function Thumbnails({ numPages, currentPage, rotation, width, onSelectPage }) {
  return (
    <aside className="pdf-thumbnails" aria-label="Page thumbnails">
      {Array.from({ length: numPages ?? 0 }, (_, index) => {
        const pageNumber = index + 1;
        const isActive = currentPage === pageNumber;

        return (
          <div
            key={`thumb_${pageNumber}`}
            className={`pdf-thumbnail${isActive ? ' pdf-thumbnail--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Thumbnail
              pageNumber={pageNumber}
              width={width}
              rotate={rotation}
              onItemClick={({ pageNumber: targetPage }) => onSelectPage(targetPage)}
            />
            <span className="pdf-thumbnail__label">Page {pageNumber}</span>
          </div>
        );
      })}
    </aside>
  );
}
