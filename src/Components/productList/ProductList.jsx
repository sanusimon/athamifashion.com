
    import Pagination from "@/Components/Pagination/Pagination";
    import { wixClientServer } from "@/lib/wixClientServer";
    import Link from "next/link";



    const PRODUCT_PER_PAGE = 8;


    export default async function ProductList ({ categoryId,limit,searchParams }) {
        const categorySlug = searchParams?.cat || ''; 
        searchParams = await searchParams;
       

        if (!categoryId) {
            return <div>Error: No category ID provided</div>; // ✅ Return JSX
        }

        const wixClient = await wixClientServer();

        try {
            let productQuery =  wixClient.products
                .queryProducts()
                .startsWith("name" , searchParams?.name || "")
                // .hasSome("productCategory", searchParams?.category && searchParams.category !== "All Products" 
                //     ? [searchParams.category] 
                //     : [])
                .hasSome("collectionIds", [categoryId])
                .gt("priceData.price",searchParams?.min || 0)
                .lt("priceData.price",searchParams?.max || 9999)
                .limit(limit || PRODUCT_PER_PAGE)
                .skip(
                    searchParams?.page 
                    ? parseInt(searchParams.page) * (limit || PRODUCT_PER_PAGE)
                    : 0
                );
                const collections = await wixClient.collections.queryCollections().find();
                
                if (searchParams?.category && searchParams.category !== "All Products") {
                    // Make sure you're filtering by a valid collection ID
                    const selectedCollection = collections.items.find(c => c.name === searchParams.category);
                    
                    if (selectedCollection) {
                        productQuery = productQuery.hasSome("collectionIds", [selectedCollection._id]);
                       
                    } else {
                        console.warn(`No matching collection found for: ${searchParams.category}`);
                    }
                }
                
        
                // ✅ Apply sorting
                if (searchParams?.sort) {
                    const [sortType, sortBy] = searchParams.sort.split(" ");
                
                    if (sortType === "asc") {
                      productQuery = productQuery.ascending(sortBy); // Reassign the query
                    }
                    if (sortType === "desc") {
                      productQuery = productQuery.descending(sortBy); // Reassign the query
                    }
                  }
                
                  const res = await productQuery.find();
                  

            if (!res.items || res.items.length === 0) {
                return <div>No products found for this category.</div>; // ✅ Return JSX
            }

            return (
                <div>
                <div className="product_page">
                    <div className="container">
                        <div className='inner_'>
                            <ul className="product_list">
                                {res.items.map((product,index)=>{
                                    return(
                                    <li className="" key={index}>
                                         <Link href={`/${product.slug}?cat=${categorySlug}`}>
                                        <div className='img_wrap'>
                                            <img src={product.media?.items[1]?.image?.url} />
                                            {product.ribbon && 
                                                <div className="ribbon_">
                                                    {product.ribbon}
                                                </div>
                                            }
                                        </div>
                                        <div className="name__">
                                        <label className='cat_name'>{product.name}</label>  
                                        {/* <label className='cat_price'>${product.price?.price}</label>   */}
                                        </div>
                                        <div className="btm_area">
                                            <div className='price_area'>
                                                {product.price?.price === product.price?.discountedPrice ? (
                                                    <label className="cat_price">₹{Math.floor(product.price?.price)}</label>

                                                ) : 
                                                
                                                (
                                                    <div className='discount_sec'>
                                                        <label className="cat_price">₹{Math.floor(product.price?.discountedPrice)}</label> 
                                                        <label className="cat_price line_throw">₹{Math.floor(product.price?.price)}</label> 
                                                    </div>
                                                    )                    
                                            }
                                            </div>
                                            <button className="add_cart">Add to Cart</button>
                                        </div>
                                        </Link>
                                    </li>
                                    )
                                })}
                            </ul>
                            {searchParams?.cat || searchParams?.name ? (
                            <Pagination currentPage={res.currentPage || 0} hasPrev={res.hasPrev()} hasNext={res.hasNext()} />
                        ) : null}
                            </div>
                    </div>
                </div>
                </div>
            );
        } catch (error) {
            console.error("Wix API Error:", error);
            return <div>Error: {error.message || "Failed to fetch products"}</div>; // ✅ Return JSX
        }
    };
