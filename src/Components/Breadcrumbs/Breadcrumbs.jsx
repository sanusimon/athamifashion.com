"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { wixClientServer } from "@/lib/wixClientServer";

const Breadcrumbs = ({ product, categoryName }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [resolvedCategoryName, setResolvedCategoryName] = useState(null);

  const catSlug = searchParams.get("cat");

  useEffect(() => {
    setIsClient(true);

    const fetchCategoryName = async () => {
      if (!categoryName && catSlug) {
        const wixClient = await wixClientServer();
        const result = await wixClient.collections.queryCollections().find();
        const match = result.items.find((cat) => cat.slug === catSlug);
        if (match) {
          setResolvedCategoryName(match.name);
        }
      }
    };

    fetchCategoryName();
  }, [catSlug, categoryName]);

  if (!isClient || pathname === "/") return null; // ⛔ Don't render on home

  const breadcrumbItems = [
    { name: "Home", path: "/" }, // ✅ Add back Home
  ];


  // Pages like /profile, /orders, /settings
  if (pathname === "/profile") {
    breadcrumbItems.push({ name: "Profile", path: "/profile" });
  } else if (pathname === "/orders") {
    breadcrumbItems.push({ name: "Orders", path: "/orders" });
  } else if (pathname.startsWith("/orders/")) {
    const orderId = pathname.split("/")[2]; // /orders/[id]
    breadcrumbItems.push({ name: "Orders", path: "/orders" });
    breadcrumbItems.push({ name: `Order #${orderId}`, path: pathname });
  } else if (pathname === "/cart") {
    breadcrumbItems.push({ name: "Cart", path: "/cart" });
  }
  




  const finalCategoryName = categoryName || resolvedCategoryName;

  if (pathname.startsWith("/list") && finalCategoryName) {
    breadcrumbItems.push({
      name: finalCategoryName,
      path: `/list?cat=${catSlug}`,
    });
  }

  if (pathname.startsWith("/product") && product) {
    breadcrumbItems.push({
      name: product.name,
      path: `/product/${product.slug}?cat=${catSlug}`,
    });
  }

  return (
    <nav className="breadcrumbs">
      <ul>
        {breadcrumbItems.map((item, index) => (
          <li key={index}>
            <Link href={item.path}>{item.name}</Link>
            {index < breadcrumbItems.length - 1 && " / "}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
