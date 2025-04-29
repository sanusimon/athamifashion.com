"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { wixClientServer } from "@/lib/wixClientServer";
import "./DiscountSection.scss";

export default function DiscountSection() {
  const [discountTiers, setDiscountTiers] = useState([]);

  useEffect(() => {
    const fetchDiscounts = async () => {
      const wixClient = await wixClientServer();
      const res = await wixClient.products.queryProducts().find();

      const discountMap = new Map();

      res.items.forEach((product) => {
        const price = product.priceData?.price;
        const discounted = product.priceData?.discountedPrice;

        if (price && discounted && discounted < price) {
          const percent = Math.floor(((price - discounted) / price) * 100);
          const rounded = Math.floor(percent / 10) * 10; // Round down to nearest 10%

          if (rounded >= 10 && !discountMap.has(rounded)) {
            discountMap.set(rounded, {
              discountValue: rounded.toString(),
              imgPath: "/discountimg.jpg", // Replace with dynamic image logic if needed
              discountText: `Unveiling This Season's<br><span>Fashion</span>`,
            });
          }
        }
      });

      const sortedTiers = Array.from(discountMap.values()).sort(
        (a, b) => parseInt(a.discountValue) - parseInt(b.discountValue)
      );
      setDiscountTiers(sortedTiers);
    };

    fetchDiscounts();
  }, []);

  return (
    <section className="disc_sec section_">
        <div className="inner_">
          {discountTiers.map((discount) => (
            <div className="item_" key={discount.discountValue}>
              <Link href={`/list?discount=${discount.discountValue}`}>
                <div className="img_wrap">
                  <img src={discount.imgPath} alt={`${discount.discountValue}% Off`} />
                </div>
                <div className="text_">
                  <h3 dangerouslySetInnerHTML={{ __html: discount.discountText }} />
                  <p>{discount.discountValue}% or More</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
    </section>
  );
}
