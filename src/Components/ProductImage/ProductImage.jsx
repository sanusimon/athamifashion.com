"use client";

import { useState, useEffect } from "react";
import ThumbSlider from "./ThumbSlider";

export default function ProductGallery({ mediaItems = [] }) {
  const [imagesToDisplay, setImagesToDisplay] = useState(mediaItems);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setImagesToDisplay(mediaItems);
    setActiveIndex(0);
  }, [mediaItems]);

  if (!imagesToDisplay || imagesToDisplay.length === 0) {
    return <div>No images available</div>;
  }

  return (
    <div className="img_wrap_horizontal">
      <div className="large_">
        <img src={imagesToDisplay[activeIndex]?.image?.url} alt="Product Image" />
      </div>

      <ThumbSlider
        imagesToDisplay={imagesToDisplay}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />
    </div>
  );
}
