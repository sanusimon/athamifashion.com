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
  const [availableColors, setAvailableColors] = useState([]); // State for colors
  const selectedSize = searchParams.getAll("size");
  const selectedCategories = searchParams.getAll("cat");
  const selectedDiscounts = searchParams.getAll("discount");
  const selectedColors = searchParams.getAll("color"); // Selected colors
  const [accordionOpen, setAccordionOpen] = useState({
    categories: true,
    size: false,
    price: false,
    discount: false,
    color: false, // Accordion for color
  });

  const [openAccordion, setOpenAccordion] = useState("categories"); // default open
  const [isFixed, setIsFixed] = useState(false);
useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const footer = document.querySelector("footer"); // or your footer class

    let footerTop = Infinity;

    // if (footer) {
    //   footerTop = footer.getBoundingClientRect().top;
    // }

    // Apply class when scroll > 100
    // Remove when footer enters viewport
    if (scrollY > 80 && footerTop > window.innerHeight) {
      setIsFixed(true);
    } else {
      setIsFixed(false);
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => window.removeEventListener("scroll", handleScroll);
}, []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const wixClient = await wixClientServer();
    
        const cats = await wixClient.collections.queryCollections().find();
        setCategories(cats.items);
    
        const products = await wixClient.products.queryProducts().find();
        const discountSet = new Set();
        const colorSet = new Set();
    
        products.items.forEach((product) => {
          const price = product.priceData?.price;
          const discounted = product.priceData?.discountedPrice;
          if (price && discounted && discounted < price) {
            const discountPercent = Math.round(((price - discounted) / price) * 100);
        
            // Ensure 100% discounts are correctly added to the set
            if (discountPercent === 100) {
              discountSet.add(100);
            } else if (discountPercent < 100) {
              discountSet.add(discountPercent);
            }
          }
          // ✅ Add this block to populate colorSet
          product.variants?.forEach((variant) => {
            const color = variant.choices?.Color;
            if (color) {
              colorSet.add(color);
            }
          });

        });
        
    
        setAvailableDiscounts(Array.from(discountSet).sort((a, b) => a - b));
        setAvailableColors(Array.from(colorSet));
      } catch (err) {
        console.error("Failed to load filters from Wix:", err);
        setAvailableDiscounts([]); // Fallback: no filter shown
        setAvailableColors([]);
      }
    };
    
    
  
    fetchData();
  }, []);

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const handleCheckboxChange = (e, name) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = e.target.value;
    const existingValues = params.getAll(name);
  
    if (e.target.checked) {
      if (!existingValues.includes(value)) {
        params.append(name, value);
      }
    } else {
      const updatedValues = existingValues.filter((v) => v !== value);
      params.delete(name);
      updatedValues.forEach((v) => params.append(name, v));
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
    <div className={`filter_area ${isFixed ? "is-fixed" : ""}`}>
      <div className="sticky_">
        {/* Categories Filter */}
        <div className="filter_group">
          <h4
            onClick={() => toggleAccordion("categories")}
            className={`filtr_hd ${openAccordion === "categories" ? "active" : ""}`}
          >
            Categories {accordionOpen.categories ? "▾" : "▸"}
          </h4>

          <div className={`filter_content ${openAccordion === "categories" ? "active" : ""}`}>
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
        </div>

        {/* Size Filter */}
        <div className="filter_group ">
          <h4
            onClick={() => toggleAccordion("size")}
            className={`filtr_hd ${openAccordion === "size" ? "active" : ""}`}
          >
            Size {accordionOpen.size ? "▾" : "▸"}
          </h4>

          <div className={`filter_content size_ ${openAccordion === "size" ? "active" : ""}`}>
            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
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
          <h4
            onClick={() => toggleAccordion("price")}
            className={`filtr_hd ${openAccordion === "price" ? "active" : ""}`}
          >
            Price {accordionOpen.price ? "▾" : "▸"}
          </h4>

          <div className={`filter_content ${openAccordion === "price" ? "active" : ""}`}>
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
        </div>

        {/* Discount Filter */}
        {availableDiscounts.length > 0 && (
  <div className="filter_group">
    <h4
      onClick={() => toggleAccordion("discount")}
      className={`filtr_hd ${openAccordion === "discount" ? "active" : ""}`}
    >
      Discount {accordionOpen.discount ? "▾" : "▸"}
    </h4>

    <div className={`filter_content ${openAccordion === "discount" ? "active" : ""}`}>
      {availableDiscounts.map((percent) => (
        <label key={percent}>
          <input
            type="checkbox"
            name="discount"
            value={percent}
            checked={selectedDiscounts.includes(percent.toString())}
            onChange={(e) => handleCheckboxChange(e, "discount")}
          />
          {percent === 100 ? "100% OFF" : `${percent}% or more`}
        </label>
      ))}
    </div>
  </div>
)}



        {/* Color Filter */}
        {availableColors.length > 0 && (
          <div className="filter_group">
            <h4
              onClick={() => toggleAccordion("color")}
              className={`filtr_hd ${openAccordion === "color" ? "active" : ""}`}
            >
              Color {accordionOpen.color ? "▾" : "▸"}
            </h4>

            <div className={`filter_content color_ ${openAccordion === "color" ? "active" : ""}`}>
              {availableColors.map((color, index) => (
                <label key={index}>
                  <input
                    type="checkbox"
                    name="color"
                    value={color}
                    checked={selectedColors.includes(color)}
                    onChange={(e) => handleCheckboxChange(e, "color")}
                  />
                  <span
                    className="color_box"
                    style={{ backgroundColor: color }}
                  ></span>
                  
                </label>
              ))}
            </div>
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
