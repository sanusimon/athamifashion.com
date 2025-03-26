// "use client"
// import React, { useContext, useEffect, useState } from 'react'
// import CategoryApiContext from '../../Context/CategoryApi/CategoryApiContext'
// import ApiContext from '../../Context/ProductApi/ApiContext'
// import Link from 'next/link'
// import ProductListing from '../../Components/ProductList/product'

// function Electronics() {
//     const {products} = useContext(ApiContext)
//     // const [electro , setElectro] = useState([])

//     // useEffect(()=>{
//     //     const electrFilter = products.filter((epro)=> epro.category.slug === "electronics");
//     //     setElectro(electrFilter);
        

//     // },[products])

//   return (
//     <section className='categories_sec prod_sec'>
//       <div className='container'>
//         <div className='inner_'>
//           <h1 className='title'>Electronics</h1>
//           <ProductListing products={products} categorySlug="electronics" />
//           {/* <ul className='product_list'>
//             {electro?.map((electro,index)=>{
//                  return<li key={index}>
//                  <Link href={`/product/${electro.slug}`}>
//                    <div className='img_wrap'>
//                        <img src={electro.images} />
//                      </div>
//                      <label className='cat_name'>{electro.title}</label> 
//                    </Link>
//                </li>
//                 })
//             }
//           </ul> */}
//         </div>
//       </div>
//     </section>
//   )
// }

// export default Electronics
