"use client";

const { useState, useEffect } = require("react");
import CategoryApiContext, { categoryFetch } from "./CategoryApiContext";


const CategoryApiContextProvider = ({children}) =>{
    const [category , setCategory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=>{
        const getCatgeoryProduct = async () =>{
            try{
                const categoryFetchs = await categoryFetch();
                setCategory(categoryFetchs);
                setLoading(false)
            }
            catch(err){
                setError('Failed to fetch products');
                setLoading(false);
            }
        }
        getCatgeoryProduct();
    },[])

    return(
        <CategoryApiContext.Provider value={{category,loading,error}}>
           {children} 
        </CategoryApiContext.Provider>
    )

}
export default CategoryApiContextProvider;