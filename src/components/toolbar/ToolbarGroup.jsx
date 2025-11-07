export default function ToolbarGroup({ label, children }) {
  return (
    <div className="pdf-controls-cluster" role="group" aria-label={label}>
      {children}
    </div>
  );
}
