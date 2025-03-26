"use client"
import React from "react";
import axios from "axios";

const ApiContext = React.createContext()

const API_URL = 'https://api.escuelajs.co/api/v1/products';


export const fetchproducts = async () =>{
    try{
        const response = await axios.get(API_URL);
        return response.data;
        
    }
    catch(error){
        console.error('Error fetching products:', error);
        throw error;
    }
}


export default ApiContext