"use client"
import React, { useEffect, useState } from "react";
import ApiContext, { fetchproducts } from "./ApiContext";



const ApiContextProvider = ({children}) => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(()=>{
        const getProduct = async () =>{
            try{
                const fetchedProducts = await fetchproducts();
                setProducts(fetchedProducts)
                setLoading(false)
            } catch(err){
                setError('Failed to fetch products');
                setLoading(false)
            }
        }
        getProduct();
    },[])

    return(
        <ApiContext.Provider value={{products,loading,error}}>
            {children}
        </ApiContext.Provider>
    )

}

export default ApiContextProvider;


