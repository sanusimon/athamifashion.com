"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";

const Breadcrumbs = ({ product }) => {
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
  ];

  // Add "All Products" only for /list and /product pages
  if (pathname.startsWith("/list") || pathname.startsWith("/product")) {
    breadcrumbItems.push({ name: "All Products", path: "/list" });
  }

  // Page-specific breadcrumbs
  if (pathname === "/profile") {
    breadcrumbItems.push({ name: "Profile", path: "/profile" });
  } else if (pathname === "/orders") {
    breadcrumbItems.push({ name: "Orders", path: "/orders" });
  } else if (pathname.startsWith("/orders/")) {
    const orderId = pathname.split("/")[2];
    breadcrumbItems.push({ name: "Orders", path: "/orders" });
    breadcrumbItems.push({ name: `Order #${orderId}`, path: pathname });
  } else if (pathname === "/cart") {
    breadcrumbItems.push({ name: "Cart", path: "/cart" });
  } else if (pathname === "/login") {
    breadcrumbItems.push({ name: "Login", path: "/login" });
  } else if (pathname === "/refund-policy") {
    breadcrumbItems.push({ name: "Refund-policy", path: "/refund-policy" });
  } else if (pathname === "/contact") {
    breadcrumbItems.push({ name: "Contact", path: "/contact" });
  }

  // Categories for product list
  if (pathname.startsWith("/list") && catSlugs.length > 0 && allCategories.length > 0) {
    const selectedCatNames = catSlugs
      .map((slug) => allCategories.find((cat) => cat.slug === slug)?.name)
      .filter(Boolean);

    if (selectedCatNames.length > 0) {
      breadcrumbItems.push({
        name: `Categories: ${selectedCatNames.join(", ")}`,
        path: "#",
      });
    }
  }

  if (sizeParams.length > 0) {
    breadcrumbItems.push({
      name: `Sizes: ${sizeParams.join(", ")}`,
      path: "#",
    });
  }

  if (discountParams.length > 0) {
    breadcrumbItems.push({
      name: `Discounts: ${discountParams.join("%, ")}%`,
      path: "#",
    });
  }

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
