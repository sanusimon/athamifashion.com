"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import ReviewStars from "@/components/Review/ReviewStars";

const RelatedProductsClient = ({ products = [], category }) => {
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ids = products.map((p) => p._id).filter(Boolean);
        if (!ids.length) return setRatings({});
        const res = await fetch(`/api/reviews/ratings?ids=${ids.join(",")}`);
        const json = await res.json();
        setRatings(json.summaries || {});
      } catch (err) {
        setRatings({});
      }
    };

    fetchRatings();
    const iv = setInterval(fetchRatings, 30000);
    return () => clearInterval(iv);
  }, [products]);

  if (!products || products.length === 0) return null;

  return (
    <div className="related_products">
      <h3 className="title">Related Products</h3>
      <ul className="product_list">
        {products.map((item) => (
          <li key={item._id} className="product_card">
            <Link href={`/${item.slug}?cat=${category}`}>
              <div className="top_area">
                <div className="img_wrap">
                  <img src={item.media?.items[0]?.image?.url} alt={item.name} />
                  {item.ribbon && <div className="ribbon_">{item.ribbon}</div>}
                </div>
              </div>
              <div className="btm_area">
                <div className="name__">
                  <label className="cat_name">{item.name}</label>
                  <div style={{ marginTop: 8 }}>
                    <ReviewStars rating={ratings[item._id]?.averageRating || 0} count={ratings[item._id]?.reviewCount || 0} />
                  </div>
                </div>
                <div className="var_price">
                  <div className="price_area">
                    {item.priceData?.price === item.priceData?.discountedPrice ? (
                      <label className="cat_price">Rs.{Math.floor(item.priceData?.price)}</label>
                    ) : (
                      <div className="discount_sec">
                        <label className="cat_price">Rs.{Math.floor(item.priceData?.discountedPrice)}</label>
                        <label className="cat_price line_throw">Rs.{Math.floor(item.priceData?.price)}</label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelatedProductsClient;
