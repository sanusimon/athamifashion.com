"use client";

import Pagination from "@/Components/Pagination/Pagination";
import { wixClientServer } from "@/lib/wixClientServer";
import Link from "next/link";
import { Navigation, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { useEffect, useRef, useState } from "react";
import createDOMPurify from "dompurify";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade"; // Import fade effect

// Register Swiper modules
SwiperCore.use([Navigation, Autoplay]);

export default function HomeProductList({ categoryId, limit, searchParams }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const swiperRef = useRef(null); // ✅ Swiper reference
   const DOMPurifyRef = useRef(null);
     useEffect(() => {
       if (typeof window !== "undefined") {
         DOMPurifyRef.current = createDOMPurify(window);
       }})
   

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
                    .descending("lastUpdated")
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
    console.log(products)
    

    return (
        <div className="product_page">
            <div className="container">
                <div className="inner_">
                    {products.length >= 4 && (
                            <div className="swiper-navigation">
                                <button className="swiper-button-prev" onClick={() => swiperRef.current?.slidePrev()}>
                                    
                                </button>
                                <button className="swiper-button-next" onClick={() => swiperRef.current?.slideNext()}>
                                    
                                </button>
                            </div>
                        )}

                    <Swiper
                        className="Home_product_list"
                        modules={[Autoplay, ...(products.length >= 4 ? [Navigation] : [])]} // Dynamically include Navigation module
                        spaceBetween={20}
                        slidesPerView={4}
                        onSwiper={(swiper) => (swiperRef.current = swiper)} // ✅ Store Swiper instance
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        
                        breakpoints={{
                            320: { slidesPerView: 2 }, // 1 slide on small screens
                            767: { slidesPerView: 3 }, // 2 slides on medium screens
                            1024: { slidesPerView: 4 }, // 3 slides on large screens
                            1280: { slidesPerView: 4 }, // 4 slides on extra-large screens
                            1600: { slidesPerView: 5 }, // 5 slides on ultra-wide screens
                        }}
                        // autoplay={{ delay: 3000, disableOnInteraction: false }}
                    >
                        {products.map((product, index) => (
                            <SwiperSlide className="item" key={index}>
                                <Link href={`/${product.slug}?cat=${searchParams?.cat || ''}`}>
                                    <div className="top_area">
                                        <div className="img_wrap">
                                            <img src={product.media?.items[0]?.image?.url} alt={product.name} />
                                            {product.stock?.inventoryStatus === "OUT_OF_STOCK" ? (
                                                <div className="ribbon_ sold_out">Sold Out</div>
                                                ) : (
                                                product.ribbon && <div className="ribbon_">{product.ribbon}</div>
                                                )}

                                            {product.priceData?.price > product.priceData?.discountedPrice && (
                                            <div className="discount_percent">
                                                {Math.round(
                                                ((product.priceData.price - product.priceData.discountedPrice) /
                                                    product.priceData.price) *
                                                    100
                                                )}
                                                % OFF
                                            </div>
                                            )}
                                        </div>
                                        <button className="add_cart">Add to Cart</button>
                                    </div>
                                    <div className="btm_area">
                                    <div className="name__">
                                        <label className="cat_name">{product.name}</label>
                                        {DOMPurifyRef.current &&
                                            product.description &&
                                            product.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() && (
                                                <span
                                                dangerouslySetInnerHTML={{
                                                    __html: DOMPurifyRef.current.sanitize(product.description),
                                                }}
                                                ></span>
                                            )}


                                    </div>
                                    <div className="var_price">

                                        <div className="price_area">
                                            {product.priceData?.price === product.priceData?.discountedPrice ? (
                                                <label className="cat_price">Rs.{Math.floor(product.priceData?.price)}</label>
                                            ) : (
                                                <div className="discount_sec">
                                                    <label className="cat_price">Rs.{Math.floor(product.priceData?.discountedPrice)}</label>
                                                    <label className="cat_price line_throw">Rs.{Math.floor(product.priceData?.price)}</label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                   
                                        
                                    </div>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    {searchParams?.cat || searchParams?.name ? (
                        <Pagination currentPage={0} hasPrev={false} hasNext={false} />
                    ) : null}

                    <div className="view-all-btn">

                    {categoryId === "aaa0c353-9221-99a5-d14a-94adb5b393f8"? (
                        <Link className="add_cart" href={`/list?cat=featured-product`}>
                            View All
                        </Link>
                    ) :  categoryId === "9efec466-d925-c73f-c294-210f3cb6701f" ? 
                    (
                    <Link className="add_cart" href={`/list?cat=kurti-2-pc-set`}>
                        View All
                    </Link>) : categoryId === "d16ee365-b5b0-8fa5-dadd-cfcf2cb90ac8" ? 
                    (
                    <Link className="add_cart" href={`/list?cat=kurtis-1`}>
                        View All
                    </Link>) : ""}
                        

                        
                    </div>

                </div>
            </div>
        </div>
    );
}
