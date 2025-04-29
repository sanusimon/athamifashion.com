
import React from 'react'
import Categories from '../category/page'
import ProductList from '../../Components/productList/ProductList'
import HomeBanner from '@/Components/HomeBanner/HomeBanner'
import HomeProductList from '@/Components/HomeProduct/HomeProduct'
import AgeFilterHome from '@/Components/AgeFilterHome/AgeFilterHome'
import Skeleton from '@/Components/Skeleton'
import { Suspense } from 'react'
import DiscountSection from '@/Components/DiscountSection/DiscountSection'
import Positives from '@/Components/Positives/Positives'


const HomePage = async() =>  {
  return (
    <>
      {/* <Header/> */}
      <HomeBanner />
      <Positives />
      <Categories />
      {/* <AgeFilterHome /> */}
      <section className="product_page home_product">
        <div className="container">
            <h2 className="title">Featured Product</h2>
          </div>
          <Suspense fallback={<Skeleton />}>
            <HomeProductList categoryId={process.env.FEATTURED_PRODUCTS_CATEGORY_ID} limit={8}/>
          </Suspense>
        </section>

        <section className="product_page home_product">
        <div className="container">
          <h2 className="title">Kurti</h2>
        </div>
        <Suspense fallback={<Skeleton />}>
          <HomeProductList categoryId={process.env.KURTIES_PRODUCTS_CATEGORY_ID} limit={8}/>
        </Suspense>
        </section>
        
        <DiscountSection />

        <section className="product_page home_product">
        <div className="container">
          <h2 className="title">Feeding Kurti</h2>
        </div>
        <Suspense fallback={<Skeleton />}>
          <HomeProductList categoryId={process.env.FEEDING_KURTIES_PRODUCTS_CATEGORY_ID}  limit={8}/>
        </Suspense>
        </section>

        
      
        
      {/* <Electronics /> */}
    </>
  )
}

export default HomePage
