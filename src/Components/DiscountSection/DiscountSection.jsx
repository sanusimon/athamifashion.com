"use client";

import React from "react";
import Link from "next/link";
import "./DiscountSection.scss";

export default function DiscountSection() {
  const discountValue = 10; // Set the static discount value
  const imgPath = `/discountimg.jpg`;
  // const imgPath2 = `/discountimg.jpg`;

  const discountText = "Unveiling This Season's<br><span>Fashion Trends</span>";
  // const discountText2 = "Now’s the Time<br><span>To Upgrade Your Wardrobe</span>";

  return (
    <section className="disc_sec section_">
      <div className="inner_">
        <div className="item_">
          <Link href={`/list?discount=${discountValue}`}>
            <div className="img_wrap">
              <img src={imgPath} alt={`${discountValue}% Off`} className="primary" />
              {/* <img src={imgPath2} alt={`${discountValue}% Off Alternate`} className="secondary" /> */}
            </div>
            <div className="text_">
              <h3 dangerouslySetInnerHTML={{ __html: discountText }} />
              {/* <h4 dangerouslySetInnerHTML={{ __html: discountText2 }} /> */}
              <p>{discountValue}% or More</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
