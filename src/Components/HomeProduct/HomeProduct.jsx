"use client";

import Pagination from "@/Components/Pagination/Pagination";
import { wixClientServer } from "@/lib/wixClientServer";
import Link from "next/link";
import { Navigation, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { useEffect, useState } from "react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade"; // Import fade effect

// Register Swiper modules
SwiperCore.use([Navigation, Autoplay]);

export default function HomeProductList({ categoryId, limit, searchParams }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categoryId) return;

        const fetchProducts = async () => {
            try {
                const wixClient = await wixClientServer();

                // ✅ Correct way to fetch products
                const res = await wixClient.products
                    .queryProducts()
                    .hasSome("collectionIds", [categoryId]) // Filter by category
                    .limit(limit || 8) // Default limit to 8 products
                    .find();

                setProducts(res.items || []);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [categoryId, limit]);

    if (!categoryId) {
        return <div className="container">Error: No category ID provided</div>;
    }

    if (loading) {
        return <div className="container">Loading...</div>;
    }

    if (!products.length) {
        return <div className="container">No products found for this category.</div>;
    }

    return (
        <div className="product_page">
            <div className="container">
                <div className="inner_">
                    <Swiper
                        className="Home_product_list"
                        modules={[Navigation, Autoplay]}
                        spaceBetween={20}
                        slidesPerView={4}
                        navigation
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                    >
                        {products.map((product, index) => (
                            <SwiperSlide className="item" key={index}>
                                <Link href={`/${product.slug}?cat=${searchParams?.cat || ''}`}>
                                    <div className="img_wrap">
                                        <img src={product.media?.items[0]?.image?.url} alt={product.name} />
                                        {product.ribbon && <div className="ribbon_">{product.ribbon}</div>}
                                    </div>
                                    <div className="name__">
                                        <label className="cat_name">{product.name}</label>
                                    </div>
                                    <div className="btm_area">
                                        <div className="price_area">
                                            {product.price?.price === product.price?.discountedPrice ? (
                                                <label className="cat_price">₹{Math.floor(product.price?.price)}</label>
                                            ) : (
                                                <div className="discount_sec">
                                                    <label className="cat_price">₹{Math.floor(product.price?.discountedPrice)}</label>
                                                    <label className="cat_price line_throw">₹{Math.floor(product.price?.price)}</label>
                                                </div>
                                            )}
                                        </div>
                                        <button className="add_cart">Add to Cart</button>
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    {searchParams?.cat || searchParams?.name ? (
                        <Pagination currentPage={0} hasPrev={false} hasNext={false} />
                    ) : null}

                    <div className="view-all-btn">
                        <Link href={`/list?cat=${searchParams?.cat || categoryId}`}>View All</Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
