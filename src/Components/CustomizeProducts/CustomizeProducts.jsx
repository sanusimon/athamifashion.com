"use client"
import React, { useEffect, useState } from 'react'
import AddQuantity from '../AddQuantity/AddQuantity'

function CustomizeProducts({ productId, variants, productOptions }) {
    const [selectOptions, setSelectOptions] = useState({});
    const [selectVariant, setSelectVariant] = useState(null);

    useEffect(() => {
        const variant = variants.find((v) => {
            const variantChoices = v.choices;
            if (!variantChoices) return false;
            
            return Object.entries(selectOptions).every(([key, value]) => variantChoices[key] === value);
        });
        
        setSelectVariant(variant || null);
    }, [selectOptions, variants]);

    const handleOptionSelect = (optionType, choice) => {
        setSelectOptions((prev) => ({ ...prev, [optionType]: choice }));
    };

    const isVariantStock = (choices) => {
        if (!variants || variants.length === 0) return false;
        return variants.some((variant) => {
            const variantChoices = variant.choices;
            if (!variantChoices) return false;

            return (
                Object.entries(choices).every(([key, value]) => variantChoices[key] === value) &&
                variant.stock?.inStock &&
                variant.stock?.quantity &&
                variant.stock.quantity > 0
            );
        });
    };

    return (
        <div className='custome_options'>
            {productOptions.map((options) => (
                <div className={options.name === "Color" ? "color_wrap custm_wrap" : "size_wrap custm_wrap"} key={options.name}>
                    <span className='cart_label_'>Choose a {options.name}</span>
                    <div className='options_'>
                        {options.choices.map((choice) => {
                            const isDisabled = !isVariantStock({ ...selectOptions, [options.name]: choice.description });
                            const isSelected = selectOptions[options.name] === choice.description;

                            return (
                                <div className='options_' key={choice.description} onClick={() => handleOptionSelect(options.name, choice.description)}>
                                    {options.name === "Color" ? (
                                        <span className={`${isDisabled ? "disabled color_span" : "color_span"} ${isSelected ? "selected_" : ""}`} 
                                            style={{ backgroundColor: choice.description }}>
                                        </span>
                                    ) : (
                                        <span className={`${isDisabled ? "disabled size_span" : "size_span"} ${isSelected ? "selected_" : ""}`}>
                                            {choice.description}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            <AddQuantity productId={productId} variantId={selectVariant?._id || "00000000-000000-000000-000000000000"} stockNumber={selectVariant?.stock?.quantity ?? 0} isSelected={Object.keys(selectOptions).length === productOptions.length} />
        </div>
    );
}

export default CustomizeProducts;
