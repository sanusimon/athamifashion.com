"use client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import "./homeBanner.scss";
import { wixClientServer } from "@/lib/wixClientServer";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import createDOMPurify from "dompurify";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade"; // Import fade effect

// Register Swiper modules
SwiperCore.use([Navigation, Pagination, Autoplay, EffectFade]);

const HomeBanner = () => {
      // const DOMPurifyServer = DOMPurify(window);
  const [cats, setCats] = useState([]);
  const DOMPurifyRef = useRef(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      DOMPurifyRef.current = createDOMPurify(window);
    }

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

  const imgArray = [
    { imgPath: "/banner1.jpg", bannerText:"	Unveiling This Season's<br> <span> Fashion</span>", id: "img1", categorySlug: cats[0]?.slug || "all-products" },
    { imgPath: "/banner2.jpg",bannerText:"Epitome of the Big<br> <span>Sweater</span>", id: "img2", categorySlug: cats[1]?.slug || "all-products" },
    { imgPath: "/banner3.jpg",bannerText:"Unveiling This Season's<br> <span> Fashion</span>", id: "This Is A<br> Long Open<br> <span>Robe</span>", categorySlug: cats[2]?.slug || "all-products" },
    { imgPath: "/banner4.jpg",bannerText:"Epitome of the Big<br> <span>Sweater</span>", id: "img4", categorySlug: cats[3]?.slug || "all-products" },
    { imgPath: "/banner5.jpg",bannerText:"This Is A Long Open<br> <span>Robe</span>", id: "img5", categorySlug: cats[4]?.slug || "all-products" },
  ];

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
            <div className="banner_txt">
            {DOMPurifyRef.current && (
                <h2
                  dangerouslySetInnerHTML={{
                    __html: DOMPurifyRef.current.sanitize(img.bannerText),
                  }}
                />
              )}

              {cats.length > 0 && (
              <Link className="banner_btn add_cart" href={`/list?cat=${img.categorySlug}`}>
                Buy Now
              </Link>
            )}
            </div>
            
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HomeBanner;
