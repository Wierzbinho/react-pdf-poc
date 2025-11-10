import { usePrint } from '../../hooks/usePrint.js';

export default function PrintTool() {
  const { print, isPrinting } = usePrint();

  return (
    <button type="button" onClick={print} disabled={isPrinting}>
      Print
    </button>
  );
}
