export const dynamic = "force-dynamic";
export const revalidate = 0;
import './productDetail.scss';
import { wixClientServer } from "@/lib/wixClientServer";
import AddQuantity from '@/Components/AddQuantity/AddQuantity';
import { JSDOM } from "jsdom";
import DOMPurify from 'dompurify';
import { notFound } from 'next/navigation';
import CustomizeProductsWrapper from '@/Components/CustomizeProductsWrapper/CustomizeProductsWrapper';
import Link from 'next/link';
import Head from 'next/head';
import ReviewSummary from '@/Components/Review/ReviewSummary';
import ReviewList from '@/Components/Review/ReviewList';
import { getReviewSummaryByProductId } from '@/lib/reviewService';
import RelatedProductsClient from '@/Components/RelatedProductsClient';

const DetailPage = async ({ params, searchParams }) => {
  const category = searchParams?.cat || "all-products";

  const window = new JSDOM('').window;
  const DOMPurifyServer = DOMPurify(window);

  const wixClient = await wixClientServer();
  const products = await wixClient.products.queryProducts().eq("slug", params.slug).find();

  if (!products.items[0]) {
    notFound();
  }

  const product = products.items[0];
  const reviewSummary = await getReviewSummaryByProductId(product._id);
  const collectionId = product.collectionIds?.[0];
  let relatedProducts = [];

  if (collectionId) {
    const result = await wixClient.products
      .queryProducts()
      .hasSome("collectionIds", [collectionId])
      .ne("_id", product._id)
      .limit(4)
      .find();

    relatedProducts = result.items;
  }

  return (
    <section className="product_detail">
        <Head>
        <title>{product.name} | AthamiFashion</title>
        <meta name="description" content={product.description || "Discover this amazing product at AthamiFashion."} />
        <meta name="robots" content="index, follow" />
        <meta name="keywords" content={`${product.name}, online shopping, AthamiFashion`} />

        {/* Open Graph Tags */}
        <meta property="og:title" content={`${product.name} | AthamiFashion`} />
        <meta property="og:description" content={product.description || "Discover this amazing product at AthamiFashion."} />
        <meta property="og:image" content={product.media?.items[0]?.image?.url || "/placeholder.jpg"} />
        <meta property="og:url" content={`https://athamifashion.com/products/${product.slug}`} />
        
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "${product.name}",
              "image": "${product.media?.items[0]?.image?.url || '/placeholder.jpg'}",
              "description": "${product.description}",
              "brand": {
                "@type": "Brand",
                "name": "AthamiFashion"
              },
              "offers": {
                "@type": "Offer",
                "priceCurrency": "INR",
                "price": "${product.priceData?.price || 0}",
                "availability": "https://schema.org/InStock"
              }
            }
          `}
        </script>
      </Head>
      <div className="container">
        <div className="inner_">
          {product.variants && product.productOptions ? (
            <CustomizeProductsWrapper
              productId={product._id}
              variants={product.variants}
              productOptions={product.productOptions}
              defaultImages={product.media?.items || []}
              name={product.name}
              description={product.description}
              price={product.priceData}
              discount={product.discount}
              additionalInfoSections={product.additionalInfoSections}
            />
          ) : (
            <AddQuantity
              productId={product._id}
              variantId="00000000-000000-000000-000000000000"
              stockNumber={product.stock?.quantity ?? 0}
            />
          )}
        </div>
        <ReviewSummary summary={reviewSummary} />
        {reviewSummary.reviewCount > 0 && <ReviewList reviews={reviewSummary.reviews} />}
        {relatedProducts.length > 0 && (
          <RelatedProductsClient products={relatedProducts} category={category} />
        )}
      </div>
    </section>
  );
};

export default DetailPage;
