import { Inter } from "next/font/google";
// import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./main.scss";
import StoreProvider from "../redux/storeProvider";

const inter = Inter({ subsets: ["latin"] });

import TopNavbar from "../components/navbars/TopNavbar";
import { PopupModal } from "../components/modals/popupModal";


import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export const metadata = {
  title: "reactPanel",
  description: "Simple control panel for reactJS,NestJS and any nodeJS apps",
};

export default function RootLayout({ children }) {
  return (
    <StoreProvider>
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>{metadata.title}</title>
          <link rel="icon" href="/images/logo/square_white_bg.svg" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" />
        </head>
        <body className={inter.className}>
          <TopNavbar />
          {children}
          {/* <PopupModal /> */}
          <ToastContainer />
        </body>
      </html>
    </StoreProvider>
  );
}
