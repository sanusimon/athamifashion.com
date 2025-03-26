"use client"
import { useSearchParams } from "next/navigation"; 
import { useEffect, useState } from 'react'; 
import Link from 'next/link';

const Breadcrumbs = ({ product, categoryName }) => {
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const catSlug = searchParams.get("cat");
  const categoryNameInBreadcrumb = categoryName || (catSlug ? catSlug.replace("-", " ") : null);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
  ];

  if (categoryNameInBreadcrumb) {
    breadcrumbItems.push({
      name: categoryNameInBreadcrumb,
      path: `/list?cat=${catSlug}`,
    });
  }

  if (product) {
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
            <Link href={item.path}>
              {item.name}
            </Link>
            {index < breadcrumbItems.length - 1 && " / "}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
