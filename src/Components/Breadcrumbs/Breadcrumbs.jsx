"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";

const Breadcrumbs = ({ product, categoryName }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [allCategories, setAllCategories] = useState([]);

  const catSlugs = searchParams.getAll("cat");
  const discountParams = searchParams.getAll("discount");
  const sizeParams = searchParams.getAll("size");

  useEffect(() => {
    setIsClient(true);

    const fetchCategoryNames = async () => {
      if (pathname.startsWith("/list") && catSlugs.length > 0) {
        const wixClient = await wixClientServer();
        const result = await wixClient.collections.queryCollections().find();
        setAllCategories(result.items);
      }
    };

    fetchCategoryNames();
  }, [pathname, catSlugs]);

  if (!isClient || pathname === "/") return null;

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "All Products", path: "/list" },
  ];

  // Add all selected categories as a single breadcrumb item
  if (pathname.startsWith("/list") && catSlugs.length > 0 && allCategories.length > 0) {
    const selectedCatNames = catSlugs
      .map((slug) => {
        const match = allCategories.find((cat) => cat.slug === slug);
        return match?.name;
      })
      .filter(Boolean);

    if (selectedCatNames.length > 0) {
      breadcrumbItems.push({
        name: `Categories: ${selectedCatNames.join(", ")}`,
        path: "#",
      });
    }
  }

  // Add size filters
  if (sizeParams.length > 0) {
    breadcrumbItems.push({
      name: `Sizes: ${sizeParams.join(", ")}`,
      path: "#",
    });
  }

  // Add discount filters
  if (discountParams.length > 0) {
    breadcrumbItems.push({
      name: `Discounts: ${discountParams.join("%, ")}%`,
      path: "#",
    });
  }

  // Add product name if on product page
  if (pathname.startsWith("/product") && product) {
    breadcrumbItems.push({
      name: product.name,
      path: `/product/${product.slug}`,
    });
  }

  return (
    <nav className="breadcrumbs">
      <ul>
        {breadcrumbItems.map((item, index) => (
          <li key={index}>
            {item.path !== "#" ? (
              <Link href={item.path}>{item.name}</Link>
            ) : (
              <span>{item.name}</span>
            )}
            {index < breadcrumbItems.length - 1 && " / "}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
