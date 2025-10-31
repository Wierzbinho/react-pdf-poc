import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs, Thumbnail } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Toolbar from './components/Toolbar.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const SAMPLE_PDF_URL =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
const BASE_PAGE_WIDTH = 780;
const THUMBNAIL_WIDTH = 180;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const ROTATION_STEP = 90;

export default function App() {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const pageRefs = useRef([]);
  const isPrintingRef = useRef(false);
  const isDownloadingRef = useRef(false);
  const autoScrollTargetRef = useRef(null);
  const autoScrollTimeoutRef = useRef(null);

  const scrollToPage = (pageNumber) => {
    const target = pageRefs.current[pageNumber - 1];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  };

  const goToPage = (pageNumber, { scroll = true } = {}) => {
    if (!numPages) {
      return;
    }

    const clamped = Math.min(Math.max(pageNumber, 1), numPages);
    setCurrentPage(clamped);
    setPageInput(String(clamped));

    if (scroll) {
      autoScrollTargetRef.current = clamped;
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
      autoScrollTimeoutRef.current = setTimeout(() => {
        autoScrollTargetRef.current = null;
      }, 600);
      requestAnimationFrame(() => scrollToPage(clamped));
    }
  };

  const handleDocumentLoad = ({ numPages: nextNumPages }) => {
    pageRefs.current = new Array(nextNumPages).fill(null);
    setNumPages(nextNumPages);
    setCurrentPage(1);
    setPageInput('1');
    autoScrollTargetRef.current = 1;
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    autoScrollTimeoutRef.current = setTimeout(() => {
      autoScrollTargetRef.current = null;
    }, 600);
    requestAnimationFrame(() => scrollToPage(1));
  };

  const handleFirstClick = () => goToPage(1);
  const handlePreviousClick = () => goToPage(currentPage - 1);
  const handleNextClick = () => goToPage(currentPage + 1);
  const handleLastClick = () => {
    if (numPages) {
      goToPage(numPages);
    }
  };

  const resolvePageInput = () => {
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputChange = (event) => {
    setPageInput(event.target.value);
  };

  const handlePageInputBlur = () => {
    resolvePageInput();
  };

  const handlePageInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      resolvePageInput();
    }
  };

  const clampZoom = (value) => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

  const updateZoom = (nextZoom) => {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
  };

  const handleZoomOut = () => updateZoom(zoom - ZOOM_STEP);
  const handleZoomIn = () => updateZoom(zoom + ZOOM_STEP);
  const handleZoomReset = () => updateZoom(1);

  const normalizeRotation = (value) => ((value % 360) + 360) % 360;

  const adjustRotation = (delta) => {
    setRotation((prev) => normalizeRotation(prev + delta));
  };

  const handleRotateCounterClockwise = () => adjustRotation(-ROTATION_STEP);
  const handleRotateClockwise = () => adjustRotation(ROTATION_STEP);
  const handleRotateReset = () => setRotation(0);

  const handlePrintDocument = async () => {
    if (!numPages || isPrintingRef.current) {
      return;
    }

    isPrintingRef.current = true;

    try {
      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF for printing: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        iframe.remove();
        isPrintingRef.current = false;
      };

      iframe.style.position = 'fixed';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        requestAnimationFrame(cleanup);
      };

      iframe.onerror = () => {
        console.error('Unable to load PDF in print frame.');
        cleanup();
      };

      iframe.src = objectUrl;
      document.body.appendChild(iframe);
    } catch (error) {
      console.error('Unable to print PDF:', error);
      isPrintingRef.current = false;
    }
  };

  const handleDownloadDocument = async () => {
    if (!numPages || isDownloadingRef.current) {
      return;
    }

    isDownloadingRef.current = true;

    let objectUrl;
    let linkElement;

    try {
      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF for download: ${response.status}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      let suggestedName = 'document.pdf';
      try {
        const parsedUrl = new URL(SAMPLE_PDF_URL);
        const pathname = parsedUrl.pathname.split('/').filter(Boolean).pop();
        if (pathname) {
          suggestedName = pathname;
        }
      } catch {
        // use default name
      }

      linkElement = document.createElement('a');
      linkElement.href = objectUrl;
      linkElement.download = suggestedName;
      linkElement.style.display = 'none';
      document.body.appendChild(linkElement);
      linkElement.click();
    } catch (error) {
      console.error('Unable to download PDF:', error);
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

  useEffect(() => {
    if (!numPages) {
      return;
    }
    requestAnimationFrame(() => scrollToPage(currentPage));
  }, [zoom, rotation]);

  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!numPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const pageNumber = Number(entry.target.dataset.page);
          if (!pageNumber) {
            return;
          }
          const ratio = entry.intersectionRatio;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = pageNumber;
          }
        });

        if (bestIndex === -1) {
          return;
        }

        const target = autoScrollTargetRef.current;
        const reachedTarget = target && bestIndex === target && bestRatio >= 0.55;

        if (reachedTarget) {
          autoScrollTargetRef.current = null;
          if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
            autoScrollTimeoutRef.current = null;
          }
          if (currentPage !== target) {
            setCurrentPage(target);
            setPageInput(String(target));
          }
          return;
        }

        const isManualScroll = !target && bestIndex !== currentPage && bestRatio >= 0.6;

        if (isManualScroll) {
          setCurrentPage(bestIndex);
          setPageInput(String(bestIndex));
        }
      },
      {
        root: null,
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
        rootMargin: '-15% 0px -15% 0px',
      },
    );

    pageRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [numPages, currentPage]);

  return (
    <main className="pdf-viewer">
      <Toolbar
        numPages={numPages}
        currentPage={currentPage}
        pageInput={pageInput}
        onGoFirst={handleFirstClick}
        onGoPrevious={handlePreviousClick}
        onGoNext={handleNextClick}
        onGoLast={handleLastClick}
        onPageInputChange={handlePageInputChange}
        onPageInputBlur={handlePageInputBlur}
        onPageInputKeyDown={handlePageInputKeyDown}
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomOut={handleZoomOut}
        onZoomIn={handleZoomIn}
        onZoomReset={handleZoomReset}
        rotation={rotation}
        onRotateCounterClockwise={handleRotateCounterClockwise}
        onRotateClockwise={handleRotateClockwise}
        onRotateReset={handleRotateReset}
        onDownload={handleDownloadDocument}
        onPrint={handlePrintDocument}
      />
      <Document file={SAMPLE_PDF_URL} onLoadSuccess={handleDocumentLoad}>
        <div className="pdf-layout">
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
                    width={THUMBNAIL_WIDTH * zoom}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    rotate={rotation}
                    onItemClick={({ pageNumber: targetPage }) => goToPage(targetPage)}
                  />
                  <span className="pdf-thumbnail__label">Page {pageNumber}</span>
                </div>
              );
            })}
          </aside>

          <section className="pdf-pages" aria-label="Document pages">
            {Array.from({ length: numPages ?? 0 }, (_, index) => (
              <div
                className="pdf-page"
                key={`page_${index + 1}`}
                data-page={index + 1}
                ref={(element) => {
                  pageRefs.current[index] = element ?? null;
                }}
              >
                <Page
                  className="pdf-page-content"
                  pageNumber={index + 1}
                  width={BASE_PAGE_WIDTH * zoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  rotate={rotation}
                />
              </div>
            ))}
          </section>
        </div>
      </Document>
    </main>
  );
}
