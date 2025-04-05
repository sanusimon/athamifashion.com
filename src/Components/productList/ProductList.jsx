"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";
import Link from "next/link";
import Pagination from "@/Components/Pagination/Pagination";
import DOMPurify from 'dompurify'; 

const PRODUCT_PER_PAGE = 8;

export default function ProductList({ categoryId, limit }) {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    // const window = new JSDOM("").window;
    const DOMPurifyServer = DOMPurify(window);
    useEffect(() => {
        console.log("Fetching products with filters:", searchParams.toString());
        const fetchProducts = async () => {
            setLoading(true);
            const wixClient = await wixClientServer();
    
            let productQuery = wixClient.products
                .queryProducts()
                .contains("name", searchParams.get("name") || "")
                .hasSome("collectionIds", [categoryId])
                .gt("priceData.price", searchParams.get("min") || 0)
                .lt("priceData.price", searchParams.get("max") || 9999)
                .limit(limit || PRODUCT_PER_PAGE)
                .skip(
                    searchParams.get("page")
                        ? parseInt(searchParams.get("page")) * (limit || PRODUCT_PER_PAGE)
                        : 0
                );
    
            // ✅ Apply sorting
            const sortParam = searchParams.get("sort");
            if (sortParam) {
                const [sortType, sortBy] = sortParam.split(" ");
                if (sortType === "asc") {
                    productQuery = productQuery.ascending(sortBy);
                } else if (sortType === "desc") {
                    productQuery = productQuery.descending(sortBy);
                }
            }
    
            const res = await productQuery.find();
            let filteredProducts = res.items;
          
            // ✅ Apply size filter
            const selectedSize = searchParams.get("size");
            if (selectedSize) {
                filteredProducts = filteredProducts.filter(product =>
                    product.variants.some(variant => {
                        const size = variant.choices?.Size; // Get the size string (e.g., "6-12M", "1Y", "2Y")
                        
                        if (!size) return false;
    
                        // Convert "6-12M" to 12 (months), "1Y" to 1 (year), etc.
                        const sizeValue = size.includes("M") 
                            ? parseInt(size.replace("M", "")) / 12 // Convert months to years
                            : parseInt(size.replace("Years", "")); // Convert "1Y" to 1
    
                        return selectedSize === "1+" ? sizeValue >= 1 : size === selectedSize;
                    })
                );
            }
    
            setProducts(filteredProducts);
            setLoading(false);
        };
    
        fetchProducts();
    }, [searchParams, categoryId]); // ✅ Re-fetch when searchParams change
    

    if (loading) return <div>Loading products...</div>;
    if (products.length === 0) return <div>No products found.</div>;

    
 

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
                                    <span dangerouslySetInnerHTML={{ __html: DOMPurifyServer.sanitize(product.description) }}></span>
                                </div>
                                <div className="var_price">
                                    <div className="variant">
                                        {product.variants.map((variant, vIndex) => (
                                        
                                        <div key={vIndex} className={variant.stock.quantity === 0 ? "disabled" : ""}>
                                            {console.log(variant.stock.quantity === 0 )}
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
                {searchParams.get("cat") || searchParams.get("name") ? (
                    <Pagination currentPage={parseInt(searchParams.get("page") || 0)} />
                ) : null}
          </>
    );
}
