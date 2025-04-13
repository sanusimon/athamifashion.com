"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";
import "./Filter.scss";

const Filter = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [categories, setCategories] = useState([]);
  const selectedSize = searchParams.getAll("size");

  useEffect(() => {
    const fetchCategories = async () => {
      const wixClient = await wixClientServer();
      const cats = await wixClient.collections.queryCollections().find();
      setCategories(cats.items);
    };
    fetchCategories();
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

  

  const selectedCategories = searchParams.getAll("cat");

  return (
    <div className="filter_area">
        <div className="sticky_">
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
      <div className="filter_group size_">
      <h4 className="">Size</h4>
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

      
      </div>
    </div>
  );
};

export default Filter;
