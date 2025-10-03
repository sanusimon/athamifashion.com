'use client';

import React, { Suspense, useEffect, useState } from 'react';
import AddQuantity from '../AddQuantity/AddQuantity';
import DOMPurify from "isomorphic-dompurify";
import Positives from '../Positives/Positives';
import Link from 'next/link';

function CustomizeProducts({
    productId,
    variants,
    productOptions,
    onColorSelect,
    name,
    price,
    discount,
    description,
    additionalInfoSections
}) {
    const [selectOptions, setSelectOptions] = useState({});
    const [selectVariant, setSelectVariant] = useState(null);

    useEffect(() => {
        // 1. Match selected options to a variant
        const variant = variants.find((v) => {
            const variantChoices = v.choices;
            if (!variantChoices) return false;
            return Object.entries(selectOptions).every(
                ([key, value]) => variantChoices[key] === value
            );
        });

        setSelectVariant(variant || null);

        // 2. If color is selected, notify parent to change image
        const selectedColor = selectOptions["Color"];
        if (selectedColor && onColorSelect) {
            onColorSelect(selectedColor);
        }
    }, [selectOptions, variants, onColorSelect]);

    const handleOptionSelect = (optionType, choice) => {
        setSelectOptions((prev) => ({ ...prev, [optionType]: choice }));
    };

    const isVariantStock = (choices) => {
        return variants.some((variant) => {
            const variantChoices = variant.choices;
            if (!variantChoices) return false;

            return (
                Object.entries(choices).every(([key, value]) => variantChoices[key] === value) &&
                variant.stock?.inStock &&
                variant.stock.quantity > 0
            );
        });
    };

    return (
        <>
            
                <label className="detail_title">{name}</label>
                {
                    description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() && (
                <div
                    className="detail_desc"
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(description),
                    }}
                />
                )}

                <div className="price_area">
                    {price?.price === price?.discountedPrice ? (
                        <label className="detail_price">Rs.{price?.price}</label>
                    ) : (
                        <div className="discount_sec">
                            <label className="detail_price">Rs.{Math.floor(price?.discountedPrice)}</label>
                            <label className="detail_price line_throw">Rs.{Math.floor(price?.price)}</label>
                            {price?.price > price?.discountedPrice && (
  <label className="persntge">
    {Math.round(((price.price - price.discountedPrice) / price.price) * 100)}% OFF
  </label>
)}

                        </div>
                    )}
                </div>
            

            <div className='custome_options'>
                {productOptions.map((option) => (
                    <div
                        key={option.name}
                        className={option.name === "Color" ? "color_wrap custm_wrap" : "size_wrap custm_wrap"}
                    >
                        <span className='cart_label_'>Choose a {option.name}</span>
                        <div className='options_'>
                            {option.choices.map((choice) => {
                                const isDisabled = !isVariantStock({
                                    ...selectOptions,
                                    [option.name]: choice.description
                                });
                                const isSelected = selectOptions[option.name] === choice.description;

                                return (
                                    <div
                                        key={choice.description}
                                        className='options_'
                                        onClick={() => handleOptionSelect(option.name, choice.description)}
                                    >
                                        {option.name === "Color" ? (
                                            <span
                                                className={`color_span ${isDisabled ? "disabled" : ""} ${isSelected ? "selected_" : ""}`}
                                                style={{ backgroundColor: choice.description }}
                                            ></span>
                                        ) : (
                                            <span
                                                className={`size_span ${isDisabled ? "disabled" : ""} ${isSelected ? "selected_" : ""}`}
                                            >
                                                {choice.description}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                <AddQuantity
                    productId={productId}
                    variantId={selectVariant?._id || "00000000-000000-000000-000000000000"}
                    stockNumber={selectVariant?.stock?.quantity ?? 0}
                    isSelected={Object.keys(selectOptions).length === productOptions.length}
                />
                <div className='positive_sec'>
                    <Link href="refund-policy"> Refund Policy</Link>
                    <Positives />
                </div>

                {additionalInfoSections && additionalInfoSections.length > 0 && (
                    <div className="additional_info">
                        {additionalInfoSections.map((section) => (
                            <div className="info_sec" key={section.title}>
                                <span className='cart_label_'>{section.title}</span>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(section.description),
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}
                
                {/* REVIEWS */}
                 
                    
                    {/* <h1 className="text-2xl">User Reviews</h1>
                    <Suspense fallback="Loading...">
                        <Reviews productId={productId} />
                    </Suspense> */}
      
                </div>
        </>
    );
}

export default CustomizeProducts;
