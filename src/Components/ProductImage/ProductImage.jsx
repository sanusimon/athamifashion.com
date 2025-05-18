"use client";

import React, { useState, useEffect } from "react";

function ProductImage({ mediaItems = [], productOptions = {}, selectedColor = null }) {
    const [imagesToDisplay, setImagesToDisplay] = useState(mediaItems);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        let newImages = mediaItems;

        // If a color is selected and color media is available
        if (selectedColor && productOptions?.choices?.length) {
            const colorChoice = productOptions.choices.find(
                (choice) => choice.description === selectedColor
            );

            const colorImage = colorChoice?.media?.mainMedia?.image?.url;
            if (colorImage) {
                newImages = [
                    {
                        image: colorChoice.media.mainMedia.image,
                        _id: `color-${selectedColor}`,
                    },
                ];
            }
        }

        // Only update state if images actually changed
        const isSame =
            imagesToDisplay.length === newImages.length &&
            imagesToDisplay.every((img, i) => img.image?.url === newImages[i].image?.url);

        if (!isSame) {
            setImagesToDisplay(newImages);
            setIndex(0);
        }
    }, [selectedColor, productOptions, mediaItems]);

    if (!imagesToDisplay || imagesToDisplay.length === 0) {
        return <div>No images available</div>;
    }

    return (
        <div className="img_wrap">
            

            <div className="thumb_images">
                {imagesToDisplay.map((item, i) => (
                    <div key={item._id || i} onClick={() => setIndex(i)}>
                        <img src={item.image?.url} alt={`Thumbnail ${i}`} />
                    </div>
                ))}
            </div>
            <div className="large_">
                <img src={imagesToDisplay[index]?.image?.url} alt="Product Image" />
            </div>
        </div>
    );
}

export default ProductImage;
