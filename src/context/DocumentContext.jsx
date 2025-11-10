import { createContext, useContext, useMemo, useState } from 'react';

const DocumentContext = createContext(null);

export function DocumentProvider({ children }) {
  const [numPages, setNumPages] = useState(null);

  const value = useMemo(
    () => ({
      numPages,
      setNumPages,
    }),
    [numPages],
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider.');
  }
  return context;
}
