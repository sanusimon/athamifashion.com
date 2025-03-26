"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import "./homeBanner.scss";
import { wixClientServer } from "@/lib/wixClientServer";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade"; // Import fade effect

// Register Swiper modules
SwiperCore.use([Navigation, Pagination, Autoplay, EffectFade]);

const HomeBanner = () => {
  const [cats, setCats] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const wixClient = await wixClientServer();
        const result = await wixClient.collections.queryCollections().find();
        setCats(result.items || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const imgArray =[
    { imgPath: "/banner1.jpg", id: "img1" },
    { imgPath: "/banner2.jpg", id: "img2" },
    { imgPath: "/banner3.jpg", id: "img3" },
    { imgPath: "/banner4.jpg", id: "img4" },
    { imgPath: "/banner5.jpg", id: "img5" }
  ]

  return (
    <div className="banner_">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={20}
        slidesPerView={1} // Important for fade effect
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 3000, disableOnInteraction: false }} // Auto-slide every 3s
        effect="fade" // Enables fade effect
        fadeEffect={{ crossFade: true }} // Smooth transition
      >
        {imgArray.map((img, index) => (
          <SwiperSlide className="item" key={img.id || index}>
            <div className="img_wrap">
              <img src={img.imgPath} alt={`Banner ${index + 1}`} />
            </div>
            {cats.length > 0 && (
              <Link className="banner_btn add_cart" href={`/list?cat=${cats[0].slug}`}>
                Buy Now
              </Link>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HomeBanner;
