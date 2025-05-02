import React from 'react'
import './contact.scss'
import InnerBanner from '@/Components/InnerBanner/InnerBanner'

function Contact() {
  return (
    <>
    <InnerBanner title="Contact us" img="./contact-us.jpg" />
    <section className='contact_sec'>
        <div className='container'>
            <div className='inner_'>
                <div className='contact_img'>
                    <img src='/contact-us.jpg' />
                </div>
                <div className='contact_detail'>
                    <h2 className='subhead'>Contact information</h2>
                    <p><b>For any questions or concerns regarding returns or refunds,<br /> please get in touch with us at:</b></p>
                    <br />
                    <p>Email: <a href="mailto:athamifashion@gmail.com">athamifashion@gmail.com</a></p>

                    <p>Phone number:<a href="tel:9946774852"> +91 9946774852</a></p>
                </div>
            </div>
        </div>
    </section>
    </>
  )
}

export default Contact
