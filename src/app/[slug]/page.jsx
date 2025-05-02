import './productDetail.scss';
import { wixClientServer } from "@/lib/wixClientServer";
import AddQuantity from '@/Components/AddQuantity/AddQuantity';
import { JSDOM } from "jsdom";
import DOMPurify from 'dompurify';
import { notFound } from 'next/navigation';
import CustomizeProductsWrapper from '@/Components/CustomizeProductsWrapper/CustomizeProductsWrapper';
import Link from 'next/link';

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
        {relatedProducts.length > 0 && (
        <div className="related_products">
          <h3 className='title'>Related Products</h3>
          <ul className="product_list">
            {relatedProducts.map((item) => (
              <li key={item._id} className="product_card">
                <Link href={`/${item.slug}?cat=${category}`}>
                    <div className='top_area'>
                        <div className="img_wrap">
                            <img src={item.media?.items[0]?.image?.url} alt={item.name} />
                            {item.ribbon && <div className="ribbon_">{item.ribbon}</div>}
                            {item.priceData?.price > item.priceData?.discountedPrice && (
                            <div className="discount_percent">
                                {Math.round(
                                ((item.priceData.price - item.priceData.discountedPrice) /
                                    item.priceData.price) *
                                    100
                                )}
                                % OFF
                            </div>
                            )}
                        </div>
                        <button className="add_cart">Add to Cart</button>
                    </div>
                    <div className="btm_area">
                    <div className="name__">
                        <label className="cat_name">{item.name}</label>
                    </div>
                    <div className="var_price">
                    <div className="price_area">
                        {item.priceData?.price === item.priceData?.discountedPrice ? (
                            <label className="cat_price">₹{Math.floor(item.priceData?.price)}</label>
                        ) : (
                            <div className="discount_sec">
                                <label className="cat_price">₹{Math.floor(item.priceData?.discountedPrice)}</label>
                                <label className="cat_price line_throw">₹{Math.floor(item.priceData?.price)}</label>
                            </div>
                        )}
                    </div>
                </div>
                
                    
                </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </section>
  );
};

export default DetailPage;
