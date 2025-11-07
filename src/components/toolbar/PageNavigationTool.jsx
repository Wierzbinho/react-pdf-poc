import ToolbarGroup from './ToolbarGroup.jsx';

export default function PageNavigationTool({
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
}) {
  return (
    <ToolbarGroup label="Page navigation">
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
    </ToolbarGroup>
  );
}
