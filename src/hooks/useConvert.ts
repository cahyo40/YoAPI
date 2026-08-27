import { useCallback, useRef, useState } from "react";
import type { ConvertOptions } from "../types.ts";
import type {
  ConvertRequest,
  ConvertResponse,
} from "../workers/quicktype.worker.ts";

/**
 * Bridge ke quicktype Web Worker. Worker di-lazy-load saat konversi pertama.
 * Menyimpan sampel per (className+url) → hit endpoint sama beberapa kali
 * menggabungkan sampel jadi satu model lebih akurat (field opsional → nullable, T8.2).
 */
export function useConvert() {
  const workerRef = useRef<Worker | null>(null);
  const samplesRef = useRef<{ key: string; list: string[] }>({ key: "", list: [] });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);

  const run = useCallback((samples: string[], className: string, options: ConvertOptions) => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/quicktype.worker.ts", import.meta.url),
        { type: "module" },
      );
    }
    const worker = workerRef.current;
    setConverting(true);
    setError(null);
    worker.onmessage = (e: MessageEvent<ConvertResponse>) => {
      setConverting(false);
      if ("code" in e.data) setCode(e.data.code);
      else {
        setError(e.data.error);
        setCode("");
      }
    };
    worker.postMessage({ samples, className, options } satisfies ConvertRequest);
  }, []);

  // Konversi: reset sampel bila key (className) berubah, kalau tidak akumulasi.
  const convert = useCallback(
    (json: string, className: string, options: ConvertOptions) => {
      const s = samplesRef.current;
      if (s.key !== className) {
        samplesRef.current = { key: className, list: [json] };
      } else if (!s.list.includes(json)) {
        s.list.push(json);
      }
      setSampleCount(samplesRef.current.list.length);
      run(samplesRef.current.list, className, options);
    },
    [run],
  );

  return { code, error, converting, convert, sampleCount };
}
