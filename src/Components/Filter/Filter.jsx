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


 // Local state to store categories and selected category
 const [categories, setCategories] = useState([]);
 const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || '');

   // Fetch categories from the server
   useEffect(() => {
    const fetchCategories = async () => {
      const wixClient = await wixClientServer();
      const cats = await wixClient.collections.queryCollections().find();
      setCategories(cats.items);
    };

    fetchCategories();
  }, []);


    const selectFilterChange = ((e)=>{
        const {name,value} = e.target;
        const params = new URLSearchParams(searchParams);

         // Update the selected category
         params.set(name,value);
         
        if (name === 'cat') {
            setSelectedCategory(value);
        }

        
       
        
        replace(`${pathname}?${params.toString()}`)
    })

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
            <input type="text" name="min" placeholder="Min Price" onChange={selectFilterChange}></input>
        </div>
        <div className="filter_item">
            <input type="text" name="max" placeholder="Max Price" onChange={selectFilterChange}></input>
        </div>
        <div className="filter_item">
        <select className="drop_down" name="sort" onChange={selectFilterChange}>
            <option>Sort By</option>
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