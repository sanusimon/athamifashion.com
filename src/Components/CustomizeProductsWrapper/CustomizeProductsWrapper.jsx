
'use client';

import React, { useState } from 'react';
import CustomizeProducts from '../CustomizeProducts/CustomizeProducts';
import ProductImage from '../ProductImage/ProductImage';

function CustomizeProductsWrapper({
    productId,
    variants,
    productOptions,
    defaultImages,
    name,
    description,
    price,
    discount
  }) {
    const [selectedColor, setSelectedColor] = useState(null);    

    return (
        <>
            {/* Show default or color-specific images */}
            <div className='image_sec'> 
            <ProductImage
                mediaItems={defaultImages}
                productOptions={getColorOptions(productOptions)}
                selectedColor={selectedColor}
                
            />
            </div>


            {/* Handle selection and image updates */}
            <div className='content_sec'>
            <CustomizeProducts
                productId={productId}
                variants={variants}
                productOptions={productOptions}
                onColorSelect={(color) => setSelectedColor(color)}
                name={name}
                description={description}
                price={price}
                discount={discount}
                />
            </div>
        </>
    );
}

// Helper to extract "Color" option
function getColorOptions(productOptions) {
    return productOptions?.find(option => option.name === 'Color');
}

export default CustomizeProductsWrapper;
