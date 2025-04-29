import './productDetail.scss';
import { wixClientServer } from "@/lib/wixClientServer";
import AddQuantity from '@/Components/AddQuantity/AddQuantity';
import { JSDOM } from "jsdom";
import DOMPurify from 'dompurify';
import { notFound } from 'next/navigation';
import CustomizeProductsWrapper from '@/Components/CustomizeProductsWrapper/CustomizeProductsWrapper';
import ProductImage from '@/Components/ProductImage/ProductImage';

const DetailPage = async ({ params }) => {
    const window = new JSDOM('').window;
    const DOMPurifyServer = DOMPurify(window);

    const wixClient = await wixClientServer();
    const products = await wixClient.products.queryProducts().eq("slug", params.slug).find();

    if (!products.items[0]) {
        notFound();
    }

    const product = products.items[0];

    return (
        <section className="product_detail">
            <div className="container">
                <div className="inner_">
                    {/* <div className="image_sec">
                        <ProductImage defaultItems={product.media?.items || []} />
                    </div> */}

                   
                        

                        {/* Variants & Customization */}
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
                          />
                          
                        
                        ) : (
                            <AddQuantity
                                productId={product._id}
                                variantId="00000000-000000-000000-000000000000"
                                stockNumber={product.stock?.quantity ?? 0}
                            />
                        )}

                        <div className="additional_info">
                            {product.additionalInfoSections.map((section) => (
                                <div className="info_sec" key={section.title}>
                                    <h3>{section.title}</h3>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: DOMPurifyServer.sanitize(section.description),
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                   
                </div>
            </div>
        </section>
    );
};

export default DetailPage;
