import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { api } from "../../services/api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PdfViewer({ id }: { id: string }) {
  const [numPages, setNumPages] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const {
    data: pdfData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["documents", id, "raw"],
    queryFn: () => api.getDocumentRaw(id),
    gcTime: 0,
    retry: false,
  });

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-gray-50 p-6 flex flex-col items-center"
    >
      {isLoading && <p className="text-sm text-gray-400 mt-8">Loading…</p>}
      {isError && (
        <p className="text-sm text-gray-500 mt-8">
          The original file is no longer available.
        </p>
      )}
      {pdfData && (
        <Document
          file={pdfData}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="mb-4 shadow-md">
              <Page pageNumber={i + 1} width={Math.max(width - 48, 200)} />
            </div>
          ))}
        </Document>
      )}
    </div>
  );
}
