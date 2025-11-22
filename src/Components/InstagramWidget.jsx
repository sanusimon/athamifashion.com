"use client";

import { useEffect } from "react";

export default function LightWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.lightwidget.com/widgets/lightwidget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <iframe
      src="//lightwidget.com/widgets/6b65cec69b8e5ff79ce2f77200e89bbc.html"
      scrolling="no"
      allowTransparency="true"
      className="lightwidget-widget"
      style={{ width: "100%", border: 0, overflow: "hidden" }}
    ></iframe>
  );
}
