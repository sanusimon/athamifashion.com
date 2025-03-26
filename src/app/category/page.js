
import React from 'react'
import './Categories.scss'
import Link from 'next/link';
import { wixClientServer } from '@/lib/wixClientServer';

const Categories = async () => {
  const wixClient = await wixClientServer();
  
  const cats = await wixClient.collections.queryCollections().find();

  // const categoryNames = [...new Map(products.map((product) => [product.category.slug, product.category])).values()]
  // const catimage = [...new Set(products.map(product => product.category.name))];  
  
  return (
    <section className='categories_sec prod_sec'>
      <div className='container'>
        <div className='inner_'>
          <h2 className='title'>Categories</h2>
          <ul className='cat_list'>
            {cats.items.map((cat,index)=>{
              return(
                <li key={index}>
                  <Link href={`/list?cat=${cat.slug}`}>
                    <div className='img_wrap'>
                      <img src={cat.media?.mainMedia?.image.url} height={400} title=''/>
                    </div>
                    <label className='cat_name'>{cat.name}</label> 
                  </Link>
                </li>
              )
            })}
          </ul>
          </div>
      </div>
    </section>
  )
}

export default Categories