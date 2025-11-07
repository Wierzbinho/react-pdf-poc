import ToolbarGroup from './ToolbarGroup.jsx';

export default function RotationTool({ rotation, onRotateCounterClockwise, onRotateClockwise, onRotateReset }) {
  return (
    <ToolbarGroup label="Rotate controls">
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
    </ToolbarGroup>
  );
}
