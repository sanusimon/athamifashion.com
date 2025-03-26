
import React from 'react'
import Categories from '../category/page'
import ProductList from '../../Components/productList/ProductList'
import HomeBanner from '@/Components/HomeBanner/HomeBanner'
import HomeProductList from '@/Components/HomeProduct/HomeProduct'


const HomePage = async() =>  {
  return (
    <>
      {/* <Header/> */}
      <HomeBanner />
      <Categories />
      <section className="product_page home_product">
        <div className="container">
            <h2 className="title">Featured Product</h2>
          </div>
          <HomeProductList categoryId={process.env.FEATTURED_PRODUCTS_CATEGORY_ID} limit={8}/>
        </section>

        <section className="product_page home_product">
        <div className="container">
          <h2 className="title">Girls</h2>
        </div>
          <HomeProductList categoryId={process.env.GIRLS_PRODUCTS_CATEGORY_ID} limit={8}/>
        </section>

        <section className="product_page home_product">
        <div className="container">
          <h2 className="title">Boys</h2>
        </div>
          <HomeProductList categoryId={process.env.BOYS_PRODUCTS_CATEGORY_ID}  limit={8}/>
        </section>

        
      
        
      {/* <Electronics /> */}
    </>
  )
}

export default HomePage
