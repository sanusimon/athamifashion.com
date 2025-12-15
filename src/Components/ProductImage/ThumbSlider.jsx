"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

export default function ThumbSlider({ imagesToDisplay = [], activeIndex, setActiveIndex }) {
  return (
    <div className="thumb_images_horizontal">
      <Swiper
        modules={[Navigation]}
        navigation={{
          nextEl: ".thumb-next",
          prevEl: ".thumb-prev",
        }}
        spaceBetween={12}
        slidesPerView={5} // change based on how many thumbnails visible
        className="thumbSwiperHorizontal"
      >
        {imagesToDisplay.map((item, i) => (
          <SwiperSlide key={item._id || i}>
            <div
              className={`thumb_item ${activeIndex === i ? "active" : ""}`}
              onClick={() => setActiveIndex(i)}
            >
              <img src={item.image?.url} alt={`Thumbnail ${i}`} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Arrows */}
      <div className="thumb-prev">◀</div>
      <div className="thumb-next">▶</div>
    </div>
  );
}
