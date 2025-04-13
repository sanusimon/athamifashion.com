"use client";

import { useEffect } from "react";

export default function NotFoundPage() {
  useEffect(() => {
    document.body.classList.add("not-found-body");

    return () => {
      document.body.classList.remove("not-found-body");
    };
  }, []);

  return (
    <div className="common_page">
      <div className="container">
        <div className="not-found">
          <h1>404 - Page Not Found</h1>
          <p>Oops! The page you're looking for doesn't exist or has been moved.</p>
          <a href="/" className="back-home">Go back home</a>
        </div>
      </div>
    </div>
  );
}
