"use client"
import Image from 'next/image'
import React, { useState } from 'react'

function ProductImage({items}) {
    const [index,setIndex] = useState(0)
  return (
    <div className='img_wrap'>
        <div className='large_'>
             <img
                src={items[index].image?.url}
                alt='"'
             />
        </div>
        <div className='thumb_images'>
            {items.map((item,i)=>(
                <div key={item._id}
                    onClick={()=>setIndex(i)}
                >
                    <img 
                        src={item.image?.url}
                        alt='"'
                    />
                </div>
            ))}
        </div>
    </div>
  )
}

export default ProductImage
