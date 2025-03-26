"use client";

import React from "react";
import axios from "axios";

const CategoryApiContext = React.createContext()

export const categoryFetch = async () =>{
    try{
        const response = await axios.get("https://api.escuelajs.co/api/v1/categories");
        return response.data
    }
    catch(error){
        console.error('Error fetching products:', error);
        throw error;
    }
}
export default CategoryApiContext;

