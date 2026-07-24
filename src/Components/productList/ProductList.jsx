"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Pagination from "@/Components/Pagination/Pagination";
import Link from "next/link";
import DOMPurify from "dompurify";
import "./productList.scss";
import Head from "next/head";

const PRODUCT_PER_PAGE = 8;

export default function ProductList({ limit }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slugToIdMap, setSlugToIdMap] = useState({});
  const [reviewSummaries, setReviewSummaries] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const response = await fetch("/api/products");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message);
        }

        const allProducts = data.products;
        const collections = data.collections;

      
      const map = {};
      collections.forEach((cat) => {
        map[cat.slug] = cat._id;
      });
      setSlugToIdMap(map);

      const selectedCategorySlugs = searchParams.getAll("cat");
      const selectedCategoryIds = selectedCategorySlugs
        .map((slug) => map[slug])
        .filter(Boolean);

      const minPrice = parseFloat(searchParams.get("min")) || 0;
      const maxPrice = parseFloat(searchParams.get("max")) || 99999;

      const sort = searchParams.get("sort") || "";
      const [sortDir, sortField] = sort.split(" ");

      const page = parseInt(searchParams.get("page") || "0");
      const perPage = limit || PRODUCT_PER_PAGE;

      

    

      const selectedSizes = searchParams.getAll("size");
      const selectedDiscountLevels = searchParams.getAll("discount").map(Number);
      const selectedColors = searchParams.getAll("color");

      let filteredProducts = allProducts.filter((product) => {
  const discountedPrice =
    product.priceData?.discountedPrice ??
    product.priceData?.price ??
    0;

  const originalPrice = product.priceData?.price ?? 0;

  const discountPercent =
    originalPrice > 0
      ? ((originalPrice - discountedPrice) / originalPrice) * 100
      : 0;

  // Category
  const matchesCategory =
    selectedCategoryIds.length === 0 ||
    product.collectionIds?.some((id) =>
      selectedCategoryIds.includes(id)
    );

  // Price
  const matchesPrice =
    discountedPrice >= minPrice &&
    discountedPrice <= maxPrice;

  // Discount
  const matchesDiscount =
    selectedDiscountLevels.length === 0 ||
    selectedDiscountLevels.some(
      (level) => discountPercent >= level
    );

  // Size
  const matchesSize =
    selectedSizes.length === 0 ||
    product.variants?.some((variant) =>
      selectedSizes.includes(variant.choices?.Size)
    );

  // Color
  const matchesColor =
    selectedColors.length === 0 ||
    product.variants?.some((variant) =>
      selectedColors.includes(variant.choices?.Color)
    );

  return (
    matchesCategory &&
    matchesPrice &&
    matchesDiscount &&
    matchesSize &&
    matchesColor
  );
});

      // Sorting
      // Always sort by lastUpdated desc unless a sort param is provided
      if (sortField === "price") {
        filteredProducts.sort((a, b) => {
          const priceA = a.priceData?.price || 0;
          const priceB = b.priceData?.price || 0;
          return sortDir === "asc" ? priceA - priceB : priceB - priceA;
        });
      } else if (sortField === "lastUpdated") {
        filteredProducts.sort((a, b) => {
          const dateA = new Date(a.lastUpdated);
          const dateB = new Date(b.lastUpdated);
          return sortDir === "asc" ? dateA - dateB : dateB - dateA;
        });
      } else {
        // Default: sort by lastUpdated DESC
        filteredProducts.sort((a, b) => {
          const dateA = new Date(a.lastUpdated);
          const dateB = new Date(b.lastUpdated);
          return dateB - dateA;
        });
      }

      // Always paginate after sorting
      const start = page * perPage;
      const end = start + perPage;
      const paginatedProducts = filteredProducts.slice(start, end);

      // If filter change causes page to be out of range, reset to page 0
      if (filteredProducts.length > 0 && start >= filteredProducts.length) {
        const params = new URLSearchParams(window.location.search);
        params.set("page", "0");
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
        setTotalProducts(filteredProducts.length);
        setProducts(filteredProducts.slice(0, perPage));
        setLoading(false);
        return;
      }

      setTotalProducts(filteredProducts.length);
      setProducts(paginatedProducts);
      const ids = paginatedProducts.map((p) => p._id);

      console.log("Product IDs:", ids);

      if (ids.length) {
        const res = await fetch(
          `/api/reviews/summary?ids=${ids.join(",")}`
        );

        const data = await res.json();

        console.log("Review summaries:", data);

        setReviewSummaries(data.summaries || {});
      }

      // if (ids.length) {
      //   const res = await fetch(
      //     `/api/reviews/summary?ids=${ids.join(",")}`
      //   );

      //   const data = await res.json();

      //   setReviewSummaries(data.summaries || {});
        
      //   console.log("Review summaries:", data.summaries);
      // }
      setLoading(false);
    };

    fetchProducts();
  }, [searchParams]);

  useEffect(() => {
    document.body.classList.add("product-list-page");
    return () => {
      document.body.classList.remove("product-list-page");
    };
  }, []);

  const currentPage = parseInt(searchParams.get("page") || 0);
  const totalPages = Math.ceil(totalProducts / (limit || PRODUCT_PER_PAGE));
const formatPrice = (value) => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round(value));
};


  const selectedColors = searchParams.getAll("color");

  const getColorImage = (product, selectedColors) => {
    if (!selectedColors.length || !product.productOptions) return null;

    const colorOption = product.productOptions.find(opt => opt.name === "Color");
    if (!colorOption) return null;

    for (let selectedColor of selectedColors) {
      const matchedChoice = colorOption.choices.find(choice =>
        choice.description?.toLowerCase() === selectedColor?.toLowerCase()
      );

      if (matchedChoice?.media?.mainMedia?.image?.url) {
        return matchedChoice.media.mainMedia.image.url;
      }
    }

    return null;
  };

  if (loading) return <div>Loading products...</div>;
  if (products.length === 0) return <div>No products found.</div>;
  
  return (
    <>
      {/* SEO content for Product List Page */}
      <Head>
        <title>Shop Stylish and Trendy Products | AthamiFashion</title>
        <meta name="description" content="Browse through our collection of stylish products for every occasion. Find your favorite clothes and accessories at AthamiFashion." />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content="athamifashion, online shopping, trendy clothes, stylish accessories" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Shop Stylish and Trendy Products | AthamiFashion" />
        <meta property="og:description" content="Browse through our collection of stylish products for every occasion. Find your favorite clothes and accessories at AthamiFashion." />
        <meta property="og:image" content="https://athamifashion.com/images/default-banner.jpg" />
        <meta property="og:url" content="https://athamifashion.com/products" />
      </Head>
      <ul className="product_list">
  {products.flatMap((product, index) => {
    const colorOption = product.productOptions?.find(opt => opt.name === "Color");

    const matchingColorChoices = colorOption?.choices?.filter(choice =>
      selectedColors.includes(choice.description)
    ) || [];

    if (selectedColors.length > 0 && matchingColorChoices.length > 0) {
      // 🟥 Product has multiple matching colors — duplicate
      return matchingColorChoices.map((choice, colorIndex) => {
        const colorImage = choice?.media?.mainMedia?.image?.url || product.media?.items[0]?.image?.url;

        return (
          <li key={`${product._id}-${choice.description}`}>
            <Link href={`/${product.slug}?cat=${searchParams.get("cat")}`}>
              <div className="top_area">
                <div className="img_wrap">
                  <img src={colorImage} alt={`${product.name} - ${choice.description}`} />
                  {product.stock?.inventoryStatus === "OUT_OF_STOCK" ? (
                    <div className="ribbon_ sold_out">Sold Out</div>
                    ) : (
                    product.ribbon && <div className="ribbon_">{product.ribbon}</div>
                    )}
                    {product.price?.price > product.price?.discountedPrice && (
                    <div className="discount_percent">
                    {Math.round(
                      ((product.price.price - product.price.discountedPrice) / product.price.price) * 100
                    )}
                    % OFF
                  </div>
                  
                    )}
                </div>
                <button className="add_cart">Add to Cart</button>
              </div>
              <div className="btm_area">
                <div className="name__">
                  <label className="cat_name">{product.name} - {choice.description}</label>
                  {product.description &&
                    product.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim() && (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(product.description),
                        }}
                      />
                  )}

                </div>
                
                <div className="var_price">
                <div className="variant">
  {[...new Set(
    product.variants
      ?.filter(v => v.stock.quantity > 0 && v.choices.Color)
      .map(v => v.choices.Color)
  )].map((color, index) => (
    <span
      key={index}
      className="pro_clr"
      style={{ backgroundColor: color }}
    ></span>
  ))}
</div>

                                        <div className="price_area">
                                            {product.price?.price === product.price?.discountedPrice ? (
                                                <label className="cat_price">Rs.{formatPrice(product.price?.price)}</label>
                                            ) : (
                                                <div className="discount_sec">
                                                    <label className="cat_price">Rs.{formatPrice(product.price?.discountedPrice)}</label>
                                                    <label className="cat_price line_throw">Rs.{formatPrice(product.price?.price)}</label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
              </div>
            </Link>
          </li>
        );
      });
    } else {
      // 🟨 Either no color filter applied, or this product doesn't match selected colors — show once
      const defaultImage = product.media?.items[0]?.image?.url || "/placeholder.jpg";

      return (
        <li key={product._id}>
          <Link href={`/${product.slug}?cat=${searchParams.get("cat")}`}>
            <div className="top_area">
              <div className="img_wrap">
                <img src={defaultImage} alt={product.name} />
                {product.stock?.inventoryStatus === "OUT_OF_STOCK" ? (
                    <div className="ribbon_ sold_out">Sold Out</div>
                    ) : (
                    product.ribbon && <div className="ribbon_">{product.ribbon}</div>
                    )}
                {product.price?.price > product.price?.discountedPrice && (
                <div className="discount_percent">
                {Math.round(
                  ((product.price.price - product.price.discountedPrice) / product.price.price) * 100
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

  {product.description &&
    product.description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim() && (
      <span
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(product.description),
        }}
      />
  )}

  <div style={{ marginTop: 8 }}>
    {(() => {
      

      console.log(reviewSummaries);

      const summary = reviewSummaries[product._id] || {
        averageRating: 0,
        reviewCount: 0,
      };

      return (
        <div
          className="review-stars"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {[1,2,3,4,5].map((star) => (
          <span
            key={star}
            style={{
              color:
                star <= Math.round(summary.averageRating)
                  ? "#f59e0b"
                  : "#d1d5db",
            }}
          >
            ★
          </span>
        ))}

          <span
            style={{
              marginLeft: 8,
              color: "#6b7280",
              fontSize: 12,
            }}
          >
            ({summary.reviewCount})
          </span>
        </div>
      );
    })()}
  </div>
</div>
              <div className="var_price">
              <div className="variant">
                {[...new Set(
                  product.variants
                    ?.filter(v => v.stock.quantity > 0 && v.choices.Color)
                    .map(v => v.choices.Color)
                )].map((color, index) => (
                  <span
                    key={index}
                    className="pro_clr"
                    style={{ backgroundColor: color }}
                  ></span>
                ))}
              </div>

                                        <div className="price_area">
                                            {product.price?.price === product.price?.discountedPrice ? (
                                                <label className="cat_price">Rs.{formatPrice(product.price?.price)}</label>
                                            ) : (
                                                <div className="discount_sec">
                                                    <label className="cat_price">Rs.{formatPrice(product.price?.discountedPrice)}</label>
                                                    <label className="cat_price line_throw">Rs.{formatPrice(product.price?.price)}</label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
            </div>
          </Link>
        </li>
      );
    }
  })}
</ul>

      {/* Show Pagination if more than one page */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </>
  );
}
