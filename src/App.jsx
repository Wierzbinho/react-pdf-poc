import { useEffect, useMemo, useRef, useState } from 'react';
import { Document, Page, Thumbnail, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
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

const escapeHtml = (value) =>
  value.replace(/[&<>]/g, (char) => {
    if (char === '&') {
      return '&amp;';
    }
    if (char === '<') {
      return '&lt;';
    }
    if (char === '>') {
      return '&gt;';
    }
    return char;
  });

export default function App() {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMatchesByPage, setSearchMatchesByPage] = useState(() => new Map());
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const pageRefs = useRef([]);
  const isPrintingRef = useRef(false);
  const isDownloadingRef = useRef(false);
  const autoScrollTargetRef = useRef(null);
  const autoScrollTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

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

  const handleDocumentLoad = (documentProxy) => {
    const nextNumPages = documentProxy.numPages;
    setPdfDocument(documentProxy);
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

    const buildPrintableBlob = async () => {
      if (pdfDocument) {
        try {
          const data = await pdfDocument.getData();
          return new Blob([data], { type: 'application/pdf' });
        } catch (error) {
          console.warn('Falling back to network PDF fetch before printing.', error);
        }
      }

      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF for printing: ${response.status}`);
      }
      return response.blob();
    };

    isPrintingRef.current = true;

    let objectUrl;
    let iframe;
    let cleanupCalled = false;

    const cleanup = () => {
      if (cleanupCalled) {
        return;
      }
      cleanupCalled = true;
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      isPrintingRef.current = false;
    };

    try {
      const blob = await buildPrintableBlob();
      objectUrl = URL.createObjectURL(blob);

      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');

      iframe.onload = () => {
        const iframeWindow = iframe?.contentWindow;
        if (!iframeWindow) {
          cleanup();
          return;
        }

        let waitingForUser = false;
        let watchdogTimer;

        const finalize = () => {
          if (watchdogTimer) {
            clearTimeout(watchdogTimer);
            watchdogTimer = null;
          }
          iframeWindow.removeEventListener('afterprint', finalize);
          window.removeEventListener('focus', handleWindowFocus);
          cleanup();
        };

        const handleWindowFocus = () => {
          if (!waitingForUser) {
            return;
          }
          window.removeEventListener('focus', handleWindowFocus);
          finalize();
        };

        iframeWindow.addEventListener('afterprint', finalize, { once: true });
        window.addEventListener('focus', handleWindowFocus);

        requestAnimationFrame(() => {
          waitingForUser = true;
          try {
            iframeWindow.focus();
            iframeWindow.print();
            watchdogTimer = window.setTimeout(() => {
              window.removeEventListener('focus', handleWindowFocus);
              finalize();
            }, 60000);
          } catch (error) {
            console.error('Unable to open print dialog.', error);
            waitingForUser = false;
            window.removeEventListener('focus', handleWindowFocus);
            finalize();
          }
        });
      };

      iframe.onerror = () => {
        console.error('Unable to load PDF in print frame.');
        cleanup();
      };

      iframe.src = objectUrl;
      document.body.appendChild(iframe);
    } catch (error) {
      console.error('Unable to print PDF:', error);
      cleanup();
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

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!pdfDocument || !numPages || !query) {
      setSearchResults([]);
      setSearchMatchesByPage(new Map());
      setActiveMatchIndex(0);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matchesByPage = new Map();
      const results = [];

      for (let pageIndex = 0; pageIndex < numPages; pageIndex += 1) {
        const pageNumber = pageIndex + 1;
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent({ disableCombineTextItems: true });
        const itemMatchesMap = new Map();

        textContent.items.forEach((item, itemIndex) => {
          const text = item?.str ?? '';
          if (!text) {
            return;
          }

          const regex = new RegExp(escaped, 'gi');
          const matchesForItem = [];
          let match;

          while ((match = regex.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            const matchIndex = results.length;

            results.push({ pageNumber, itemIndex, start, end });
            matchesForItem.push({ matchIndex, start, end });
          }

          if (matchesForItem.length > 0) {
            itemMatchesMap.set(itemIndex, matchesForItem);
          }
        });

        if (itemMatchesMap.size > 0) {
          matchesByPage.set(pageNumber, itemMatchesMap);
        }
      }

      setSearchMatchesByPage(matchesByPage);
      setSearchResults(results);
      setActiveMatchIndex(0);
      if (results.length > 0) {
        goToPage(results[0].pageNumber);
      }
    } catch (error) {
      console.error('Search failed', error);
      setSearchError('Unable to search this document.');
      setSearchMatchesByPage(new Map());
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setSearchMatchesByPage(new Map());
      setActiveMatchIndex(0);
      setSearchError(null);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchResults.length > 0) {
      const index = Math.min(activeMatchIndex, searchResults.length - 1);
      const target = searchResults[index];
      if (target) {
        goToPage(target.pageNumber);
      }
    }
  }, [activeMatchIndex, searchResults]);

  const handleSearchToggle = () => {
    setSearchOpen((open) => {
      if (open) {
        setSearchQuery('');
        setSearchResults([]);
        setSearchMatchesByPage(new Map());
        setActiveMatchIndex(0);
        setSearchError(null);
      }
      return !open;
    });
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchMatchesByPage(new Map());
    setActiveMatchIndex(0);
    setSearchError(null);
  };

  const handleSelectMatch = (direction) => {
    const total = searchResults.length;
    if (total === 0) {
      return;
    }

    setActiveMatchIndex((prev) => {
      const next = (prev + direction + total) % total;
      goToPage(searchResults[next].pageNumber);
      return next;
    });
  };

  const textRenderersByPage = useMemo(() => {
    if (searchResults.length === 0 || searchMatchesByPage.size === 0) {
      return new Map();
    }

    const map = new Map();

    searchMatchesByPage.forEach((itemMatchesMap, pageNumber) => {
      map.set(pageNumber, ({ str, itemIndex }) => {
        const source = typeof str === 'string' ? str : '';
        const matches = itemMatchesMap.get(itemIndex);
        if (!matches || matches.length === 0) {
          return escapeHtml(source);
        }

        let cursor = 0;
        let output = '';

        matches.forEach(({ start, end, matchIndex }) => {
          const safeStart = Math.max(start, 0);
          const safeEnd = Math.max(end, safeStart);

          if (safeStart > cursor) {
            output += escapeHtml(source.slice(cursor, safeStart));
          }

          const segment = source.slice(safeStart, safeEnd);
          const isActive = matchIndex === activeMatchIndex;
          output += `<mark class="pdf-highlight${isActive ? ' pdf-highlight--active' : ''}">${escapeHtml(segment)}</mark>`;
          cursor = safeEnd;
        });

        if (cursor < source.length) {
          output += escapeHtml(source.slice(cursor));
        }

        return output;
      });
    });

    return map;
  }, [searchMatchesByPage, searchResults, activeMatchIndex]);

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
        onSearchToggle={handleSearchToggle}
      />
      {searchOpen ? (
        <div className="pdf-search-overlay" role="dialog" aria-label="Search document">
          <form className="pdf-search-form" onSubmit={handleSearchSubmit}>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Find in document"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              disabled={!pdfDocument}
            />
            <span className="pdf-search-count">
              {searchResults.length > 0
                ? `${activeMatchIndex + 1} / ${searchResults.length}`
                : '0 / 0'}
            </span>
            <div className="pdf-search-nav">
              <button type="button" onClick={() => handleSelectMatch(-1)} disabled={searchResults.length === 0}>
                ‹
              </button>
              <button type="button" onClick={() => handleSelectMatch(1)} disabled={searchResults.length === 0}>
                ›
              </button>
            </div>
            <button type="submit" disabled={!pdfDocument || isSearching}>
              {isSearching ? '…' : 'Go'}
            </button>
            <button type="button" className="pdf-search-close" onClick={handleSearchClose}>
              ×
            </button>
          </form>
          {searchError ? <p className="pdf-search-error">{searchError}</p> : null}
        </div>
      ) : null}
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
                    width={THUMBNAIL_WIDTH}
                    rotate={rotation}
                    onItemClick={({ pageNumber: targetPage }) => goToPage(targetPage)}
                  />
                  <span className="pdf-thumbnail__label">Page {pageNumber}</span>
                </div>
              );
            })}
          </aside>

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
                    pageRefs.current[index] = element ?? null;
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
        </div>
      </Document>
    </main>
  );
}
