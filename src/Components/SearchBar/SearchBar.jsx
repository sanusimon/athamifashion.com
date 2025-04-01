"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const SearchBar = () => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();


  // Use useEffect to ensure the code only runs on the client side
  useEffect(() => {
    setIsClient(true); // Set to true after component has mounted on the client
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
  
    console.log("Search triggered with name:", name);
  
    const params = new URLSearchParams(window.location.search); // Read existing filters
  
    if (name.trim()) {
      params.set("name", name);
    } else {
      params.delete("name");
    }
  
    const newUrl = `/list?${params.toString()}`;
    console.log("Navigating to:", newUrl); // Debugging
    router.push(newUrl);
  };
  


  // Don't render the search form until client-side
  if (!isClient) return null;

  return (
    <form
      className="srch_bar"
      onSubmit={handleSearch}
    >
      <input
        type="text"
        name="name"
        placeholder="Search"
        className="flex-1 bg-transparent outline-none"
        defaultValue={searchParams.get("name") || ""}
      />
      <button className="cursor-pointer">
        <Image src="/search.png" alt="Search" width={16} height={16} />
      </button>
    </form>
  );
};

export default SearchBar;
