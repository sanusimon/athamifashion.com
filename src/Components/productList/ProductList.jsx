"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";
import Pagination from "@/Components/Pagination/Pagination";
import Link from "next/link";
import DOMPurify from "dompurify";

const PRODUCT_PER_PAGE = 8;

export default function ProductList({ categoryId, limit }) {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);  // Total number of products
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            const wixClient = await wixClientServer();

            // Get min and max price from searchParams
            let minPrice = searchParams.get("min");
            let maxPrice = searchParams.get("max");

            minPrice = minPrice && !isNaN(minPrice) ? parseFloat(minPrice) : 0;
            maxPrice = maxPrice && !isNaN(maxPrice) ? parseFloat(maxPrice) : 9999;

            console.log("Min Price:", minPrice);
            console.log("Max Price:", maxPrice);

            let productQuery = wixClient.products
                .queryProducts()
                .contains("name", searchParams.get("name") || "")
                .hasSome("collectionIds", [categoryId])
                .limit(limit || PRODUCT_PER_PAGE)
                .skip(
                    searchParams.get("page")
                        ? parseInt(searchParams.get("page")) * (limit || PRODUCT_PER_PAGE)
                        : 0
                );

            // Fetch products without price filters first
            const res = await productQuery.find();
            console.log("Fetched Products from API:", res.items);

            // Filter products based on price range
            let filteredProducts = res.items;

            // Apply price filter only if valid min or max price is provided
            if (minPrice || maxPrice) {
                filteredProducts = filteredProducts.filter((product) => {
                    const productPrice = product.priceData?.price || 0;
                    return productPrice >= minPrice && productPrice <= maxPrice;
                });
            }

            console.log("Filtered Products After Price Filter:", filteredProducts);

            setTotalProducts(filteredProducts.length); // Set the total number of filtered products
            setProducts(filteredProducts);
            setLoading(false);
        };

        fetchProducts();
    }, [searchParams, categoryId]);

    // If no products are found
    if (loading) return <div>Loading products...</div>;
    if (products.length === 0) return <div>No products found.</div>;

    const currentPage = parseInt(searchParams.get("page") || 0);
    const totalPages = Math.ceil(totalProducts / (limit || PRODUCT_PER_PAGE));

    return (
        <>
            <ul className="product_list">
                {products.map((product, index) => (
                    <li key={index}>
                        <Link href={`/${product.slug}?cat=${searchParams.get("cat")}`}>
                            <div className="top_area">
                                <div className="img_wrap">
                                    <img src={product.media?.items[0]?.image?.url} alt={product.name} />
                                    {product.ribbon && <div className="ribbon_">{product.ribbon}</div>}
                                </div>
                                <button className="add_cart">Add to Cart</button>
                            </div>

                            <div className="btm_area">
                                <div className="name__">
                                    <label className="cat_name">{product.name}</label>
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurify.sanitize(product.description),
                                        }}
                                    ></span>
                                </div>
                                <div className="var_price">
                                    <div className="variant">
                                        {product.variants.map((variant, vIndex) => (
                                            <div key={vIndex} className={variant.stock.quantity === 0 ? "disabled" : ""}>
                                                {Object.entries(variant.choices).map(([key, value]) => (
                                                    <span key={key}>{value}</span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
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
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>

            {totalProducts > PRODUCT_PER_PAGE && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                />
            )}
        </>
    );
}
