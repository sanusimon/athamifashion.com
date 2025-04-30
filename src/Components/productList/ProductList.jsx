"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";
import Pagination from "@/Components/Pagination/Pagination";
import Link from "next/link";
import DOMPurify from "dompurify";
import "./productList.scss";

const PRODUCT_PER_PAGE = 8;

export default function ProductList({ limit }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slugToIdMap, setSlugToIdMap] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const wixClient = await wixClientServer();

      const categoryData = await wixClient.collections.queryCollections().find();
      const map = {};
      categoryData.items.forEach((cat) => {
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

      let productQuery = wixClient.products
        .queryProducts()
        .contains("name", searchParams.get("name") || "")
        .limit(perPage)
        .skip(page * perPage);

      if (selectedCategoryIds.length > 0) {
        productQuery = productQuery.hasSome("collectionIds", selectedCategoryIds);
      }

      const res = await productQuery.find();

      const selectedSizes = searchParams.getAll("size");
      const selectedDiscountLevels = searchParams.getAll("discount").map(Number);
      const selectedColors = searchParams.getAll("color");

      let filteredProducts = res.items.filter((product) => {
        const price = product.priceData?.price || 0;
        const discountedPrice = product.priceData?.discountedPrice || price;
        const discountPercent = ((price - discountedPrice) / price) * 100;

        const meetsDiscount =
          selectedDiscountLevels.length === 0 ||
          selectedDiscountLevels.some((level) => discountPercent >= level);

        const matchesPrice = price >= minPrice && price <= maxPrice;

        const matchesSize =
          selectedSizes.length === 0 ||
          product.variants.some((variant) =>
            selectedSizes.includes(variant.choices?.Size)
          );

        const matchesColor =
          selectedColors.length === 0 ||
          product.variants.some((variant) =>
            selectedColors.includes(variant.choices?.Color)
          );

        return matchesPrice && meetsDiscount && matchesSize && matchesColor;
      });

      // Sorting
      if (sortField === "price") {
        filteredProducts.sort((a, b) => {
          const priceA = a.priceData?.price || 0;
          const priceB = b.priceData?.price || 0;
          return sortDir === "asc" ? priceA - priceB : priceB - priceA;
        });
      }

      if (sortField === "lastUpdated") {
        filteredProducts.sort((a, b) => {
          const dateA = new Date(a.lastUpdated);
          const dateB = new Date(b.lastUpdated);
          return sortDir === "asc" ? dateA - dateB : dateB - dateA;
        });
      }

      setTotalProducts(filteredProducts.length);
      setProducts(filteredProducts);
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
  console.log(products)
  return (
    <>
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
          <li key={`product-${index}-color-${colorIndex}`}>
            <Link href={`/${product.slug}?cat=${searchParams.get("cat")}`}>
              <div className="top_area">
                <div className="img_wrap">
                  <img src={colorImage} alt={`${product.name} - ${choice.description}`} />
                  {product.ribbon && <div className="ribbon_">{product.ribbon}</div>}
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
                                    {product.variants?.map((variant, vIndex) => (
                                    <div
                                        key={vIndex}
                                        className={variant.stock.quantity === 0 ? "disabled" : ""}
                                    >
                                        <span>{variant.choices.Size}</span>
                                        {variant.choices.Color && 
                                            <span className="pro_clr" style={{ backgroundColor: variant.choices.Color }}></span>
                                        }
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
        );
      });
    } else {
      // 🟨 Either no color filter applied, or this product doesn't match selected colors — show once
      const defaultImage = product.media?.items[0]?.image?.url || "/placeholder.jpg";

      return (
        <li key={`product-${index}`}>
          <Link href={`/${product.slug}?cat=${searchParams.get("cat")}`}>
            <div className="top_area">
              <div className="img_wrap">
                <img src={defaultImage} alt={product.name} />
                {product.ribbon && <div className="ribbon_">{product.ribbon}</div>}
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
                                    {product.variants?.map((variant, vIndex) => (
                                    <div
                                        key={vIndex}
                                        className={variant.stock.quantity === 0 ? "disabled" : ""}
                                    >
                                        <span>{variant.choices.Size}</span>
                                        {variant.choices.Color && 
                                            <span className="pro_clr" style={{ backgroundColor: variant.choices.Color }}></span>
                                        }
                                        {/* {Object.entries(variant.choices || {}).map(
                                        
                                        ([key, value]) => (
                                            <span key={key}>{value}</span>
                                        )
                                        )} */}
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
      );
    }
  })}
</ul>


      {totalProducts > PRODUCT_PER_PAGE && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </>
  );
}
