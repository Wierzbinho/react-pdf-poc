import ToolbarGroup from './ToolbarGroup.jsx';

export default function SearchTool({ numPages, onSearchToggle }) {
  return (
    <ToolbarGroup label="Search document">
      <button type="button" onClick={onSearchToggle} aria-label="Search in document" disabled={!numPages}>
        <span aria-hidden="true" className="pdf-icon">
          🔍
        </span>
      </button>
    </ToolbarGroup>
  );
}
