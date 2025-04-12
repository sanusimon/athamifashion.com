"use client";


import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// import CartModal from "./CartModal";
import Cookies from "js-cookie";
// import { useCartStore } from "@/hooks/useCartStore";
import './Header.scss'
import { useWixClient } from "@/hooks/useWixClient";
import { useCartStore } from "@/hooks/useCartStore";
import SearchBar from "@/Components/SearchBar/SearchBar";
import Breadcrumbs from "@/Components/Breadcrumbs/Breadcrumbs";
import { wixClientServer } from "@/lib/wixClientServer";
import Filter from "@/Components/Filter/Filter";
import Image from "next/image";

const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);
  const filterRef = useRef(null);
  const filterBtnRef = useRef(null);
  const searchRef = useRef(null);
  const searchBtnRef = useRef(null);
  const profileRef = useRef(null);
  const profileBtnRef = useRef(null);
  
  



  // Close menu when clicking outside (excluding button)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close nav menu if clicked outside
      if (
        openMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuBtnRef.current &&
        !menuBtnRef.current.contains(event.target)
      ) {
        setOpenMenu(false);
      }
  
      // Close filter if clicked outside
      if (
        openFilter &&
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(event.target)
      ) {
        setOpenFilter(false);
      }
      // Close search if clicked outside
      if (
        openSearch &&
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        searchBtnRef.current &&
        !searchBtnRef.current.contains(event.target)
      ) {
        setOpenSearch(false);
      }   
       // Profile
    if (
      isProfileOpen &&
      profileRef.current &&
      !profileRef.current.contains(event.target) &&
      profileBtnRef.current &&
      !profileBtnRef.current.contains(event.target)
    ) {
      setIsProfileOpen(false);
    }   
    };
  
    if (openMenu || openFilter || openSearch || isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu, openFilter , openSearch , isProfileOpen]);
  
  

  const router = useRouter();

  const searchParams = useSearchParams();

  const pathName = usePathname();

  const wixClient = useWixClient();
  

  const handleCategoryClick = (slug) => {
    const params = new URLSearchParams(window.location.search);
    params.set("cat", slug);
    router.replace(`/list?${params.toString()}`); // ✅ Updates the category in the URL
    setOpenMenu(false);
};



  const isLoggedIn = wixClient.auth.loggedIn();

  

    const {cart, counter, getCart} = useCartStore();

     useEffect(() => {
      if (isLoggedIn) {
        
        getCart(wixClient); // Fetch the cart when the user is logged in
      }
    }, [wixClient, getCart, isLoggedIn]);

    const handleProfile = () => {
      if (!isLoggedIn) {
        router.push("/login");
      } else {
        setIsProfileOpen((prev) => !prev);
      }
    };

    useEffect(() => {
      if (isLoggedIn && !sessionStorage.getItem("hasReloaded")) {
        sessionStorage.setItem("hasReloaded", "true"); // Set flag
        window.location.reload(); // Reload once
      }
    }, [isLoggedIn]);

    const closeFilter = () =>{
      setOpenFilter(false);
    }
    

//   const { cart, counter, getCart } = useCartStore();




const handleLogout = async () => {
    setIsLoading(true);
    Cookies.remove("refreshToken");
    const { logoutUrl } = await wixClient.auth.logout(window.location.href);
    setIsProfileOpen(false);
    router.push(logoutUrl);
    
  };

  const [cats, setCats] = useState([]);
  const selectedCategory = searchParams.get("cat") || "";

  useEffect(() => {
      const fetchCategories = async () => {
        try {
          const wixClient = await wixClientServer();
          const result = await wixClient.collections.queryCollections().find();
          setCats(result.items || []);
          const catNames = result.items.map(cat => cat.name);
          console.log(catNames)
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      };
  
      fetchCategories();
    }, []);

  useEffect(() => {
    
  }, [wixClient]);

  
    return (
    <header className='header'>
        <div className='container'>
            <div className='inner_'>
              <div>
                <div className='logo'>
                  <Link href={'/'}>
                      <img src="./logo.png" />
                    </Link>
                </div>
                <div className='navigation'>
                <button
                  ref={menuBtnRef}
                  onClick={() => setOpenMenu((prev) => !prev)}
                  className={`menu_btn ${openMenu ? "close_menu" : ""}`}
                >
                  {openMenu ? "Close" : "Menu"}
                </button>

                <ul ref={menuRef} className={`menu-dropdown ${openMenu ? "open" : ""}`}>
                    {cats.map((category) => (
                      <li key={category.slug}
                      className={`item ${selectedCategory === category.slug ? "active" : ""}`}>
                      <Link
                        href={`/list?cat=${category.slug}`}
                        onClick={() => handleCategoryClick(category.slug)}
                      >
                        {category.name}
                      </Link>
                    </li>
                    
                    ))}
                  </ul>
                    
                </div>
                </div>
                <div className="right_sec">
                <button
                  ref={searchBtnRef}
                  onClick={() => setOpenSearch((prev) => !prev)}
                  className={`search_btn ${openSearch ? "active" : ""}`}
                >
                   <Image src="/search.png" alt="Search" width={16} height={16} />
                   {!openSearch ? "Search" : "Close"}
                </button>
                <div
                ref={searchRef}
                className={`search-dropdown ${openSearch ? "open" : ""}`}
              >
                <SearchBar onSearchComplete={() => setOpenSearch(false)} />
              </div>

                <div className='pro_cart'>
                    <div href={"/profile"} className='profile'
                     onClick={handleProfile}
                     ref={profileBtnRef}
                    // onClick={login}
                     >
                      {isProfileOpen ? "Login" : "Login"} 
                      <Image src="/user.png" alt="user" width={16} height={16} />
                        {isProfileOpen && (
                            <div ref={profileRef}
                            className="absolute p-4 rounded-md top-12 left-0 bg-white text-sm shadow-[0_3px_10px_rgb(0,0,0,0.2)] z-20">
                            <Link className="mt-2 cursor-pointer" href="/profile">Profile</Link>
                            <Link className="mt-2 cursor-pointer" href="/orders">Your Order</Link>
                            <div className="mt-2 cursor-pointer" onClick={handleLogout}>
                                {isLoading ? "Logging out" : "Logout"}
                            </div>
                            </div>
                        )}
                    
                    </div>
                    <Link href={"/cart"} className='cart'> 
                    <Image src="/shopping-cart.png" alt="shopping-cart" width={16} height={16} />
                    <span className='count'>{counter}</span></Link>
                    <button
                      ref={filterBtnRef}
                      onClick={() => setOpenFilter((prev) => !prev)}
                      className={`filter_btn ${openFilter ? "close_filter" : ""}`}
                    >
                      <Image src="/filter.png" alt="filter" width={16} height={16} />
                      
                    </button>
                </div>
                </div>
            </div>
            <Breadcrumbs />
            <div ref={filterRef} className={`filter-dropdown ${openFilter ? "open" : ""}`}>
              <span className="apply_filter" onClick={closeFilter}>Apply</span>
            <Filter />
          </div>
        </div>
    </header> 
  )
}

export default Header