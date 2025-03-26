"use client";


import { WixClientContext } from "@/Context/WixContext/WixContext";
import { useContext } from "react";

export const useWixClient = () => {
  return useContext(WixClientContext);
};