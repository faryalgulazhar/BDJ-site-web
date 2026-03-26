"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import nProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress
nProgress.configure({ 
  showSpinner: false, 
  trickleSpeed: 200,
  minimum: 0.3
});

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start progress on any route change
    nProgress.start();
    
    // Finish progress after a short delay to simulate "loading" and feel smooth
    const timer = setTimeout(() => {
      nProgress.done();
    }, 400);

    return () => {
      clearTimeout(timer);
      nProgress.done();
    };
  }, [pathname, searchParams]);

  return (
    <style jsx global>{`
      #nprogress .bar {
        background: var(--primary) !important;
        height: 3px !important;
        box-shadow: 0 0 10px var(--primary), 0 0 5px var(--primary) !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px var(--primary), 0 0 5px var(--primary) !important;
      }
    `}</style>
  );
}
