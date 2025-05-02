import React from 'react'
import "./innerBanner.scss"
function InnerBanner({title , img}) {
  return (
    <div className='inner_banner'>
      <img src={img} />
      <div className='container'>
        <span className='txt_ title'>{title}</span>
      </div>
    </div>
  )
}

export default InnerBanner
