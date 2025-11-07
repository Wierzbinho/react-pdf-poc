import ToolbarGroup from './ToolbarGroup.jsx';

export default function PrintTool({ numPages, onPrint }) {
  return (
    <ToolbarGroup label="Print document">
      <button type="button" onClick={onPrint} disabled={!numPages} aria-label="Print PDF">
        <span aria-hidden="true" className="pdf-icon">
          🖨
        </span>
      </button>
    </ToolbarGroup>
  );
}
