"use client";

import { wixClientServer } from "@/lib/wixClientServer";
import Filter from "@/Components/Filter/Filter";
import ProductList from "../../Components/productList/ProductList";
import Breadcrumbs from "@/Components/Breadcrumbs/Breadcrumbs";
import Skeleton from "@/Components/Skeleton";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const List = () => {
  const searchParams = useSearchParams();
  const [cat, setCat] = useState(null);

  useEffect(() => {
    const fetchCategory = async () => {
      const wixClient = await wixClientServer();
      const catSlug = searchParams.get("cat") || "all-products";  // Default to 'all-products' if no cat is present
      const category = await wixClient.collections.getCollectionBySlug(catSlug);
      setCat(category);
    };

    fetchCategory();
  }, [searchParams]);

  if (!cat) return <Skeleton />;  // Return a loading skeleton until category data is fetched

  return (
    <section className="product_page">
      <div className="container">
        <Breadcrumbs />
        <div className="inner_">
          <Filter />
          <Suspense fallback={<Skeleton />}>
            <ProductList
              categoryId={cat.collection?._id || "00000000-000000-000000-000000000001"}
              searchParams={searchParams}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default List;
