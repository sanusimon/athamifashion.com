"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const SearchBar = () => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Use useEffect to ensure the code only runs on the client side
  useEffect(() => {
    setIsClient(true); // Set to true after component has mounted on the client
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");

    if (name) {
      router.push(`/list?name=${name}`);
    }
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
      />
      <button className="cursor-pointer">
        <Image src="/search.png" alt="Search" width={16} height={16} />
      </button>
    </form>
  );
};

export default SearchBar;
