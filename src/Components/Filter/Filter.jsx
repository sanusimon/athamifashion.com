"use client"

import React, { useEffect, useState } from 'react'; // Add this import

import { usePathname, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation";
import "./Filter.scss"  
import { wixClientServer } from '@/lib/wixClientServer';

 const Filter = ({}) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const{ replace } = useRouter();

 
    // Get the selected size from URL
 const selectedSize = searchParams.get("size") || "";
 // Local state to store categories and selected category
 const [categories, setCategories] = useState([]);
 const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || '');

    // ✅ Sync `selectedCategory` when URL changes
    useEffect(() => {
      setSelectedCategory(searchParams.get("cat") || "");
  }, [searchParams]);


   // Fetch categories from the server
    useEffect(() => {
        const fetchCategories = async () => {
            const wixClient = await wixClientServer();
            const cats = await wixClient.collections.queryCollections().find();
            setCategories(cats.items);
        };
        fetchCategories();
    }, []);


       // Handle filter change
       const selectFilterChange = (e) => {
        const { name, value } = e.target;
        const params = new URLSearchParams(searchParams);

        params.set(name, value);
        replace(`${pathname}?${params.toString()}`);
    };
    

  return (
    <div className='filter_area'>
        <div className="filter_item">
            <select
                className="drop_down"
                name="cat"
                onChange={selectFilterChange}
                value={selectedCategory}
                >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                    <option key={cat._id} value={cat.slug}>
                    {cat.name}
                    </option>
                ))}
            </select>
        </div>
        <div className="filter_item">
          <select className="drop_down" name="size" value={selectedSize} onChange={selectFilterChange}>
              <option value="">All Sizes</option>
              <option value="0-3M">0-3 Months</option>
              <option value="3-6M">3-6 Months</option>
              <option value="6-9M">6-9 Months</option>
              <option value="9-12M">9-12 Months</option>
              <option value="1+">1+ Years</option> {/* ✅ New option for 1Y+ */}
          </select>
      </div>

        <div className="filter_item">
            <input type="text" name="min" placeholder="Min Price" onChange={selectFilterChange}></input>
        </div>
        <div className="filter_item">
            <input type="text" name="max" placeholder="Max Price" onChange={selectFilterChange}></input>
        </div>
        <div className="filter_item">
          <select className="drop_down" name="sort" onChange={selectFilterChange}>
              <option value="">Sort By</option>
              <option value="asc price">Price (low to high)</option>
              <option value="desc price">Price (high to low)</option>
              <option value="asc lastUpdated">Newest</option>
              <option value="desc lastUpdated">Oldest</option>
          </select>
        </div>




    </div>
  )
}

export default Filter