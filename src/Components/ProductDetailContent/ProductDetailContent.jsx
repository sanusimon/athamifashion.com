"use client";
import React, { useState, useEffect } from "react";
import ProductImage from "@/Components/ProductImage/ProductImage";
import CustomizeProducts from "@/Components/CustomizeProducts/CustomizeProducts";
import AddQuantity from "@/Components/AddQuantity/AddQuantity";

function ProductClientWrapper({ product }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [allImages, setAllImages] = useState([]);

  useEffect(() => {
    // Extract all images from color options
    const colorOption = product.productOptions.find((opt) => opt.name === "Color");
    const colorImages = colorOption?.choices?.filter(c => c?.media?.mainMedia?.image?.url) || [];

    // Fallback to default product media
    const defaultImages = product.media?.items || [];

    const merged = [...colorImages, ...defaultImages];

    setAllImages(merged);
    setSelectedImage(merged[0]);
  }, [product]);

  const handleColorSelect = (color) => {
    const colorOption = product.productOptions.find((opt) => opt.name === "Color");
    const matchedChoice = colorOption?.choices.find((choice) => choice.description === color);

    if (matchedChoice?.media?.mainMedia?.image?.url) {
      setSelectedImage(matchedChoice); // Set as the current image
    }
  };

  return (
    <section className="product_detail">
      <div className="container">
        <div className="inner_">
          <div className="image_sec">
            <ProductImage
              images={allImages}
              selectedImage={selectedImage}
              onImageClick={setSelectedImage}
            />
          </div>

          <div className="content_sec">
            <label className="detail_title">{product.name}</label>

            <div className="price_area">
              {product.priceData?.price === product.priceData?.discountedPrice ? (
                <label className="detail_price">₹{product.priceData?.price}</label>
              ) : (
                <div className="discount_sec">
                  <label className="detail_price">₹{product.priceData?.discountedPrice}</label>
                  <label className="detail_price line_throw">₹{product.priceData?.price}</label>
                  <label className="persntge">{product.discount?.value}% OFF</label>
                </div>
              )}
            </div>

            {product.variants && product.productOptions ? (
              <CustomizeProducts
                productId={product._id}
                variants={product.variants}
                productOptions={product.productOptions}
                onColorSelect={handleColorSelect}
              />
            ) : (
              <AddQuantity
                productId={product._id}
                variantId="00000000-000000-000000-000000000000"
                stockNumber={product.stock?.quantity ?? 0}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductClientWrapper;
