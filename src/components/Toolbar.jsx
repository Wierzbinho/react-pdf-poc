import PageNavigationTool from './toolbar/PageNavigationTool.jsx';
import ZoomTool from './toolbar/ZoomTool.jsx';
import RotationTool from './toolbar/RotationTool.jsx';
import SearchTool from './toolbar/SearchTool.jsx';
import DownloadTool from './toolbar/DownloadTool.jsx';
import PrintTool from './toolbar/PrintTool.jsx';

export default function Toolbar({
  numPages,
  currentPage,
  pageInput,
  onGoFirst,
  onGoPrevious,
  onGoNext,
  onGoLast,
  onPageInputChange,
  onPageInputBlur,
  onPageInputKeyDown,
  zoom,
  minZoom,
  maxZoom,
  onZoomOut,
  onZoomIn,
  onZoomReset,
  rotation,
  onRotateCounterClockwise,
  onRotateClockwise,
  onRotateReset,
  onDownload,
  onPrint,
  onSearchToggle,
  searchOverlayProps,
}) {
  return (
    <div className="pdf-controls-container">
      <div className="pdf-controls" role="toolbar" aria-label="PDF controls">
        <div className="pdf-controls-group">
          <PageNavigationTool
            numPages={numPages}
            currentPage={currentPage}
            pageInput={pageInput}
            onGoFirst={onGoFirst}
            onGoPrevious={onGoPrevious}
            onGoNext={onGoNext}
            onGoLast={onGoLast}
            onPageInputChange={onPageInputChange}
            onPageInputBlur={onPageInputBlur}
            onPageInputKeyDown={onPageInputKeyDown}
          />

          <div className="pdf-controls-divider" aria-hidden="true" />

          <ZoomTool
            zoom={zoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            onZoomOut={onZoomOut}
            onZoomIn={onZoomIn}
            onZoomReset={onZoomReset}
          />

          <div className="pdf-controls-divider" aria-hidden="true" />

          <RotationTool
            rotation={rotation}
            onRotateCounterClockwise={onRotateCounterClockwise}
            onRotateClockwise={onRotateClockwise}
            onRotateReset={onRotateReset}
          />

          <div className="pdf-controls-divider" aria-hidden="true" />

          <SearchTool numPages={numPages} onSearchToggle={onSearchToggle} overlayProps={searchOverlayProps} />

          <div className="pdf-controls-divider" aria-hidden="true" />

          <DownloadTool numPages={numPages} onDownload={onDownload} />

          <div className="pdf-controls-divider" aria-hidden="true" />

          <PrintTool numPages={numPages} onPrint={onPrint} />
        </div>
      </div>
    </div>
  );
}
