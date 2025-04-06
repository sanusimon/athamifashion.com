import { wixClientServer } from "@/lib/wixClientServer";
import Filter from "@/Components/Filter/Filter";
import ProductList from "../../Components/productList/ProductList";
import Breadcrumbs from "@/Components/Breadcrumbs/Breadcrumbs";
import Skeleton from "@/Components/Skeleton";
import { Suspense } from "react";


const List = async ({searchParams}) => {
  const wixClient = await wixClientServer();
  
  const cat = await wixClient.collections.getCollectionBySlug(
    searchParams.cat || "all-products"
  );

  
  

  return (

    <section className="product_page">  
      <div className="container">
      <Breadcrumbs />
        <div className="inner_">
          <Filter />
          <Suspense fallback={<Skeleton />}>
          <ProductList 
          categoryId={cat.collection?._id || "00000000-000000-000000-000000000001"} 
          searchParams={searchParams}/>
          </Suspense>   
          </div>
      </div>
    </section>
    
      
   
  )
}

export default List