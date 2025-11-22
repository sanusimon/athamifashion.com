
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
import InstagramWidget from "@/Components/InstagramWidget";



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
            <h2 className="title">New Arrivals</h2>
          </div>
          <Suspense fallback={<Skeleton />}>
            <HomeProductList categoryId={process.env.FEATTURED_PRODUCTS_CATEGORY_ID} limit={8}/>
          </Suspense>
        </section>

        {/* <section className="product_page home_product">
        <div className="container">
          <h2 className="title">Co-ord set</h2>
        </div>
        <Suspense fallback={<Skeleton />}>
          <HomeProductList categoryId={process.env.KURTIES_CORDSET_PRODUCTS_CATEGORY_ID} limit={8}/>
        </Suspense>
        </section> */}
        
        <DiscountSection />

        <section className="product_page home_product">
        <div className="container">
          <h2 className="title">Top & Pant</h2>
        </div>
        <Suspense fallback={<Skeleton />}>
          <HomeProductList categoryId={process.env.KURTIES_TWO_PIECE_PRODUCTS_CATEGORY_ID}  limit={8}/>
        </Suspense>
        </section>
        <section className="product_page home_product">
          <div className="container">
            <h2 className="title">Kurties</h2>
          </div>
          <Suspense fallback={<Skeleton />}>
            <HomeProductList categoryId={process.env.KURTIES_PRODUCTS_CATEGORY_ID}  limit={8}/>
          </Suspense>
        </section>
        <section>
          <InstagramWidget />
        </section>
      
        
      {/* <Electronics /> */}
    </>
  )
}

export default HomePage
