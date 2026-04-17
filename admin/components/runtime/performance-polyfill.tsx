'use client';

import { useEffect } from 'react';

export function PerformancePolyfill() {
  useEffect(() => {
    const perf = (globalThis as any).performance;
    if (!perf) {
      return;
    }

    ['mark', 'measure', 'clearMarks', 'clearMeasures'].forEach((method) => {
      if (typeof perf[method] !== 'function') {
        perf[method] = () => {};
      }
    });
  }, []);

  return null;
}
