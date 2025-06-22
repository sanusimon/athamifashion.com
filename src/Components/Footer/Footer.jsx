"use client";

import { useWixClient } from "@/hooks/useWixClient";
import React, { useEffect, useState } from "react";
import Link from "next/link"; // Assuming you're using Next.js
import "./footer.scss"

const Footer = () => {
  const [cats, setCats] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // Optional
  const wixClient = useWixClient(); // ✅ Move this to top level

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await wixClient.collections.queryCollections().find();
        setCats(result.items || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [wixClient]);

  return (
    <footer className="footer section_">
      <div className="container">
        <div className="inner_">
          <div className="logo_">
            <img src="/footer-logo.svg" alt="Logo" />
          </div>
          <div className="footer_menu">
          <ul className="">
              {cats.map((category) => (
                <li
                  key={category.slug}
                  className={`item ${
                    selectedCategory === category.slug ? "active" : ""
                  }`}
                >
                  <Link href={`/list?cat=${category.slug}`}>
                    {category.name}
                  </Link>
                </li>
              ))}
              <li><Link href="refund-policy"> Refund Policy</Link></li>
              <li><Link href="contact"> Contact us</Link></li>
            </ul>
          </div>
          <div className="footer_social">
            <ul>
              <li>
                <a href="https://www.instagram.com/athamifashions/" target="_blank"><img src="/instagram.png" /></a>
              </li>
              <li>
                <a href="https://www.facebook.com/profile.php?id=61576264670580" target="_blank"><img src="/facebook.png" /></a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
