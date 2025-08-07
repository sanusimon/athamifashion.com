import React from 'react'
import './Positives.scss'
function Positives() {
  return (
    <section className='our_positives'>
        <div className='container'>
        <ul>
            <li>
                <img src='/fast-delivery.png'></img>
                <span>Free shipping on orders above Rs.1500</span>
            </li>
            {/* <li>
                <img src='/cash-on-delivery.png'></img>
                <span>Cash on Delivery</span>
            </li> */}
            <li>
                <img src='/customer-satisfaction.png'></img>
                <span>Exquisitely crafted with care and intention</span>
            </li>
        </ul>
        </div>
    </section>
  )
}

export default Positives
