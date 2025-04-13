import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React from 'react'

function Sort() {
const pathname = usePathname();
const searchParams = useSearchParams();
const { replace } = useRouter();
    const handleSortChange = (e) => {
        const params = new URLSearchParams(searchParams);
        const value = e.target.value;
    
        if (value) {
          params.set("sort", value);
        } else {
          params.delete("sort");
        }
    
        replace(`${pathname}?${params.toString()}`);
      };

  return (
    <div className="filter_group sort_">
        <h4>Sort By</h4>
        <select
          className="drop_down"
          name="sort"
          defaultValue={searchParams.get("sort") || ""}
          onChange={handleSortChange}
        >
          <option value="">Default</option>
          <option value="asc price">Price (Low to High)</option>
          <option value="desc price">Price (High to Low)</option>
          <option value="desc lastUpdated">Newest</option>
          <option value="asc lastUpdated">Oldest</option>
        </select>
      </div>
  )
}

export default Sort
