import ToolbarGroup from './ToolbarGroup.jsx';

export default function ZoomTool({ zoom, minZoom, maxZoom, onZoomOut, onZoomIn, onZoomReset }) {
  return (
    <ToolbarGroup label="Zoom controls">
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
    </ToolbarGroup>
  );
}
