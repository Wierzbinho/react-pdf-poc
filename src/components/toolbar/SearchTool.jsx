import { createPortal } from 'react-dom';
import ToolbarGroup from './ToolbarGroup.jsx';
import SearchOverlay from '../SearchOverlay.jsx';

export default function SearchTool({ numPages, onSearchToggle, overlayProps }) {
  const overlay =
    overlayProps && typeof document !== 'undefined'
      ? createPortal(<SearchOverlay {...overlayProps} />, document.body)
      : null;

  return (
    <>
      <ToolbarGroup label="Search document">
        <button type="button" onClick={onSearchToggle} aria-label="Search in document" disabled={!numPages}>
          <span aria-hidden="true" className="pdf-icon">
            🔍
          </span>
        </button>
      </ToolbarGroup>
      {overlay}
    </>
  );
}
