"use client";

import Filter from "@/Components/Filter/Filter";
import ProductList from "../../Components/productList/ProductList";
import Breadcrumbs from "@/Components/Breadcrumbs/Breadcrumbs";
import Skeleton from "@/Components/Skeleton";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sort from "@/Components/Filter/Sort";

const List = () => {
  const searchParams = useSearchParams();
  const [cat, setCat] = useState(null);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        if (!data.success) return;

        const slug = searchParams.get("cat") || "all-products";

        const category = data.collections.find(
          (c) => c.slug === slug
        );

        setCat(category || null);
      } catch (err) {
        console.error(err);
      }
    }

    fetchCategory();

    document.body.classList.add("product_list_page");

    return () => {
      document.body.classList.remove("product_list_page");
    };
  }, [searchParams]);

  if (!cat) return <Skeleton />;

  return (
    <section className="product_page inner_product">
      <div className="container">
        <div className="top_bread">
          <Breadcrumbs categoryName={cat?.name} />
          <Sort />
        </div>

        <div className="inner_">
          <Filter />

          <Suspense fallback={<Skeleton />}>
            <ProductList />
          </Suspense>
        </div>
      </div>
    </section>
  );
};

export default List;