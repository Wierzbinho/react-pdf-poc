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
}) {
  return (
    <div className="pdf-controls-container">
      <div className="pdf-controls" role="toolbar" aria-label="PDF controls">
        <div className="pdf-controls-group">
          <div className="pdf-controls-cluster" role="group" aria-label="Page navigation">
            <button type="button" onClick={onGoFirst} disabled={!numPages || currentPage === 1}>
              «
            </button>
            <button type="button" onClick={onGoPrevious} disabled={!numPages || currentPage === 1}>
              ‹
            </button>
            <span>Page</span>
            <input
              type="number"
              min="1"
              value={pageInput}
              onChange={onPageInputChange}
              onBlur={onPageInputBlur}
              onKeyDown={onPageInputKeyDown}
              disabled={!numPages}
              aria-label="Go to page"
            />
            <span>of {numPages ?? '—'}</span>
            <button type="button" onClick={onGoNext} disabled={!numPages || currentPage === numPages}>
              ›
            </button>
            <button type="button" onClick={onGoLast} disabled={!numPages || currentPage === numPages}>
              »
            </button>
          </div>

          <div className="pdf-controls-divider" aria-hidden="true" />

          <div className="pdf-controls-cluster" role="group" aria-label="Zoom controls">
            <button type="button" onClick={onZoomOut} disabled={zoom <= minZoom}>
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={onZoomIn} disabled={zoom >= maxZoom}>
              +
            </button>
            <button type="button" onClick={onZoomReset} disabled={zoom === 1}>
              Reset
            </button>
          </div>

          <div className="pdf-controls-divider" aria-hidden="true" />

          <div className="pdf-controls-cluster" role="group" aria-label="Rotate controls">
            <button type="button" onClick={onRotateCounterClockwise}>
              ↺
            </button>
            <span>{rotation}°</span>
            <button type="button" onClick={onRotateClockwise}>
              ↻
            </button>
            <button type="button" onClick={onRotateReset} disabled={rotation === 0}>
              Reset
            </button>
          </div>

          <div className="pdf-controls-divider" aria-hidden="true" />

          <div className="pdf-controls-cluster" role="group" aria-label="Document actions">
            <button type="button" onClick={onSearchToggle} aria-label="Search in document" disabled={!numPages}>
              <span aria-hidden="true" className="pdf-icon">
                🔍
              </span>
            </button>
            <span className="pdf-controls-subdivider" aria-hidden="true" />
            <button type="button" onClick={onDownload} disabled={!numPages} aria-label="Download PDF">
              <span aria-hidden="true" className="pdf-icon">
                ⬇
              </span>
            </button>
            <span className="pdf-controls-subdivider" aria-hidden="true" />
            <button type="button" onClick={onPrint} disabled={!numPages} aria-label="Print PDF">
              <span aria-hidden="true" className="pdf-icon">
                🖨
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
