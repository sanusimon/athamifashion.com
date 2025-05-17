
import { Jost } from 'next/font/google';

import "./globals.css";
import "./globals.scss"
import ApiContextProvider from "../Context/ProductApi/ApiContextProvider";
import CategoryApiContextProvider from "../Context/CategoryApi/CategoryApiContextProvider";
import Header from "../Components/Layout/Header/Header";
import { WixClientContextProvider } from "@/Context/WixContext/WixContext";
import Footer from "@/Components/Footer/Footer";
import { Suspense } from 'react';



// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });


const jost = Jost({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jost',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export const metadata = {
  title: "AthamiFashion",
  description: "Shop elegant red dresses for girls, perfect for parties and occasions. Discover more at AthamiFashion.",
  icons: {
    icon: './favicon.jpeg', // Ensure the file is in the /public folder
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${jost.variable} ${jost.variable} antialiased`}
      >
        
        {/* <ApiContextProvider>
        <CategoryApiContextProvider> */}
        <WixClientContextProvider>
        <Suspense>
          <Header/>
          {children}
          <Footer />
          </Suspense>
          </WixClientContextProvider>
          {/* </CategoryApiContextProvider>
        </ApiContextProvider>
        */}
        
      </body>
    </html>
  );
}
