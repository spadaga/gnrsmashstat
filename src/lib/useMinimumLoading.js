import { useEffect, useRef, useState } from "react";

// Keep each loading animation visible for a minimum duration, while allowing
// slower requests to finish naturally. Cancel delayed hides on a new request.
export default function useMinimumLoading(loading, minimumMs = 2000) {
  const [visible, setVisible] = useState(loading);
  const startedAt = useRef(loading ? performance.now() : null);

  useEffect(() => {
    if (loading) {
      if (startedAt.current === null) startedAt.current = performance.now();
      setVisible(true);
      return;
    }

    const elapsed = startedAt.current === null ? minimumMs : performance.now() - startedAt.current;
    const timer = setTimeout(() => {
      setVisible(false);
      startedAt.current = null;
    }, Math.max(0, minimumMs - elapsed));
    return () => clearTimeout(timer);
  }, [loading, minimumMs]);

  return loading || visible;
}
