'use client';

import React, { useState } from 'react';
import ProductImage from '../ProductImage/ProductImage';


function ProductImageWrapper({ defaultItems }) {
    const [images, setImages] = useState(defaultItems);

    // Optional: handle image change logic in this wrapper if needed

    return <ProductImage items={images} />;
}

export default ProductImageWrapper;
