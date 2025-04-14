

import './productDetail.scss'
import { wixClientServer } from "@/lib/wixClientServer";
import ProductImage from '@/Components/ProductImage/ProductImage';
import CustomizeProducts from '@/Components/CustomizeProducts/CustomizeProducts';
import AddQuantity from '@/Components/AddQuantity/AddQuantity';
import Breadcrumbs from '@/Components/Breadcrumbs/Breadcrumbs';
import { JSDOM } from "jsdom";
import DOMPurify from 'dompurify'; 





const DetailPage = async ({params}) =>{
    const window = new JSDOM("").window;
    const DOMPurifyServer = DOMPurify(window);
    // const param = useParams(ApiContext);
    // const {productSlug} = param
    const wixClient = await wixClientServer();
    const products = await wixClient.products.queryProducts().eq("slug", params.slug).find();
   

    if (!products.items[0]) {
        notFound(); // 👈 This *calls* the function to trigger the 404
    }

    const product = products.items[0];

    return( 
        <section className="product_detail">
            <div className="container">
            {/* <Breadcrumbs product={product} /> */}
                <div className="inner_">
                    <div className="image_sec">
                        <ProductImage items={product.media?.items} />
                    </div>
                    <div className="content_sec">   
                        <label className="detail_title">{product.name}</label>
                        <div className='detail_desc' dangerouslySetInnerHTML={{ __html: DOMPurifyServer.sanitize(product.description) }}>
                            
                        </div>
                        <div className='price_area'>
                            {product.price?.price === product.price?.discountedPrice ? (
                                 <label className="detail_price">₹{product.price?.price}</label>

                            ) : 
                            
                            (
                                <div className='discount_sec'>
                                    <label className="detail_price">₹{product.price?.discountedPrice}</label> 
                                    <label className="detail_price line_throw">₹{product.price?.price}</label> 
                                    <label className="persntge">{product.discount?.value}% OFF</label> 
                                </div>
                                )                    
                        }
                        </div>
                        {product.variants && product.productOptions?(
                            
                            <CustomizeProducts productId={product._id} variants={product.variants} productOptions={product.productOptions} />
                            ):
                            <AddQuantity productId={product._id} variantId="00000000-000000-000000-000000000000" stockNumber={product.stock?.quantity ?? 0} />
                        }

                        {/* <Quantity productId={product.id}/>
                        <CartButton productCart={product.id}/>  */}

                        <div className='additional_info'>
                            {product.additionalInfoSections.map((section)=>(
                                <div className='info_sec' key={section.title}>
                                    <h3>
                                        {section.title}
                                    </h3>
                                    <div dangerouslySetInnerHTML={{ __html: DOMPurifyServer.sanitize(section.description) }}></div>
                                       
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
    
}
export default DetailPage;