"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";
import Pagination from "@/Components/Pagination/Pagination";
import Link from "next/link";
import DOMPurify from "dompurify";
import "./productList.scss"

const PRODUCT_PER_PAGE = 8;

export default function ProductList({ limit }) {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slugToIdMap, setSlugToIdMap] = useState({});
  const [isDiscountChecked, setIsDiscountChecked] = useState(searchParams.get("discount") === "true");

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const wixClient = await wixClientServer();
  
      // Slug-to-ID mapping
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

      // Filter products by discount if the checkbox is checked
      if (isDiscountChecked) {
        productQuery = productQuery.contains("discountedPrice", "");
      }

      const res = await productQuery.find();
  
      // Filter products by price range first
      let filteredProducts = res.items.filter((product) => {
        const price = product.priceData?.price || 0;
        return price >= minPrice && price <= maxPrice;
      });

      // Sorting by price (client-side)
      if (sortField === "price") {
        filteredProducts.sort((a, b) => {
          const priceA = a.priceData?.price || 0;
          const priceB = b.priceData?.price || 0;
          return sortDir === "asc" ? priceA - priceB : priceB - priceA;
        });
      }

      // Sorting by lastUpdated (client-side)
      if (sortField === "lastUpdated") {
        filteredProducts.sort((a, b) => {
          const dateA = new Date(a.lastUpdated);
          const dateB = new Date(b.lastUpdated);
          return sortDir === "asc" ? dateA - dateB : dateB - dateA;
        });
      }
      const selectedSizes = searchParams.getAll("size");

        if (selectedSizes.length > 0) {
        filteredProducts = filteredProducts.filter((product) =>
            product.variants.some((variant) =>
            selectedSizes.includes(variant.choices?.Size)
            )
        );
        }


      setTotalProducts(filteredProducts.length);
      setProducts(filteredProducts);
      setLoading(false);
    };
  
    fetchProducts();
  }, [searchParams, isDiscountChecked]);

  const currentPage = parseInt(searchParams.get("page") || 0);
  const totalPages = Math.ceil(totalProducts / (limit || PRODUCT_PER_PAGE));

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
                  <img
                    src={product.media?.items[0]?.image?.url || "/placeholder.jpg"}
                    alt={product.name}
                  />
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
                    {product.variants?.map((variant, vIndex) => (
                      <div
                        key={vIndex}
                        className={variant.stock.quantity === 0 ? "disabled" : ""}
                      >
                        {Object.entries(variant.choices || {}).map(
                          ([key, value]) => (
                            <span key={key}>{value}</span>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="price_area">
                    {product.price?.price === product.price?.discountedPrice ? (
                      <label className="cat_price">
                        ₹{Math.floor(product.price?.price)}
                      </label>
                    ) : (
                      <div className="discount_sec">
                        <label className="cat_price">
                          ₹{Math.floor(product.price?.discountedPrice)}
                        </label>
                        <label className="cat_price line_throw">
                          ₹{Math.floor(product.price?.price)}
                        </label>
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
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </>
  );
}
