"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";
import "./Filter.scss";

const Filter = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [categories, setCategories] = useState([]);
  const [availableDiscounts, setAvailableDiscounts] = useState([]);
  const selectedSize = searchParams.getAll("size");
  const selectedCategories = searchParams.getAll("cat");
  const selectedDiscounts = searchParams.getAll("discount");

  useEffect(() => {
    const fetchData = async () => {
      const wixClient = await wixClientServer();

      // Fetch categories
      const cats = await wixClient.collections.queryCollections().find();
      setCategories(cats.items);

      // Fetch products to determine discount tiers
      const products = await wixClient.products.queryProducts().find();

      const discountSet = new Set();

      products.items.forEach((product) => {
        const price = product.price?.price;
        const discounted = product.price?.discountedPrice;

        if (price && discounted && discounted < price) {
          const percent = Math.floor(((price - discounted) / price) * 100);
          if (percent >= 10) {
            const rounded = Math.floor(percent / 10) * 10; // Round down to nearest 10
            discountSet.add(rounded);
          }
        }
      });

      const sortedDiscounts = Array.from(discountSet).sort((a, b) => a - b);
      setAvailableDiscounts(sortedDiscounts);
    };

    fetchData();
  }, []);

  const handleCheckboxChange = (e, name) => {
    const params = new URLSearchParams(searchParams);
    const values = params.getAll(name);
    const value = e.target.value;

    if (e.target.checked) {
      params.append(name, value);
    } else {
      const newValues = values.filter((v) => v !== value);
      params.delete(name);
      newValues.forEach((v) => params.append(name, v));
    }

    replace(`${pathname}?${params.toString()}`);
  };

  const handleInputChange = (e) => {
    const params = new URLSearchParams(searchParams);
    const { name, value } = e.target;

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="filter_area">
      <div className="sticky_">
        {/* Categories Filter */}
        <div className="filter_group">
          <h4>Categories</h4>
          {categories.map((cat) => (
            <label key={cat._id}>
              <input
                type="checkbox"
                name="cat"
                value={cat.slug}
                checked={selectedCategories.includes(cat.slug)}
                onChange={(e) => handleCheckboxChange(e, "cat")}
              />
              {cat.name}
            </label>
          ))}
        </div>

        {/* Size Filter */}
        <div className="filter_group size_">
          <h4>Size</h4>
          <div className="flex">
            {["S", "M", "L", "XL", "XXL"].map((size) => (
              <label key={size}>
                <input
                  type="checkbox"
                  name="size"
                  value={size}
                  checked={selectedSize.includes(size)}
                  onChange={(e) => handleCheckboxChange(e, "size")}
                />
                {size}
              </label>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className="filter_group">
          <h4>Price</h4>
          <input
            type="text"
            name="min"
            placeholder="Min Price"
            defaultValue={searchParams.get("min") || ""}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="max"
            placeholder="Max Price"
            defaultValue={searchParams.get("max") || ""}
            onChange={handleInputChange}
          />
        </div>

        {/* Dynamic Discount Filter */}
        {availableDiscounts.length > 0 && (
          <div className="filter_group">
            <h4>Discount</h4>
            {availableDiscounts.map((percent) => (
              <label key={percent}>
                <input
                  type="checkbox"
                  name="discount"
                  value={percent}
                  checked={selectedDiscounts.includes(percent.toString())}
                  onChange={(e) => handleCheckboxChange(e, "discount")}
                />
                {percent}% or more
              </label>
            ))}
          </div>
        )}

        {/* Clear All Filters */}
        <button
          className="clear_all_btn"
          onClick={() => {
            const params = new URLSearchParams();
            replace(`${pathname}?${params.toString()}`);
          }}
        >
          Clear All Filters <span><img src="/close.png" alt="Clear" /></span>
        </button>
      </div>
    </div>
  );
};

export default Filter;
