"use client";
import { useRouter, useSearchParams } from "next/navigation";
import './AgeFilterHome.scss'

const AgeFilterHome = () => {
    const { push } = useRouter();
    const searchParams = useSearchParams();
    const selectedSize = searchParams.get("size") || ""; // ✅ Get selected value from URL


    const handleAgeFilter = (size) => {
        const encodedSize = encodeURIComponent(size); // ✅ Encode the size value
        push(`/list?cat=all-products&size=${encodedSize}`); // ✅ Redirect with correct encoding
    };
    

    return (
        <section className="age_sec">
            <div className="container">
                <div className="home_age_filter">
                    <h2 className="title text-center">Shop by Age</h2>
                    <div className="inner_">
                        <div className="age_item_"onClick={() => handleAgeFilter("0-3M")}>
                            <img src="./0-3m.png" />
                            <button>0-3 Months</button>
                        </div>
                        <div className="age_item_" onClick={() => handleAgeFilter("3-6M")}>
                            <img src="./3-6m.png" />
                            <button>3-6 Months</button>
                        </div>
                        <div className="age_item_"onClick={() => handleAgeFilter("6-9M")}>
                            <img src="./6-9m.png" />
                            <button >6-9 Months</button>
                        </div>
                        <div className="age_item_" onClick={() => handleAgeFilter("9-12M")}>
                            <img src="./9-12m.png" />
                            <button>6-9 Months</button>
                        </div>
                        <div className="age_item_" onClick={() => handleAgeFilter("1+")}>
                            <img src="./1plus.png" />
                            <button>1+ Years</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AgeFilterHome;
