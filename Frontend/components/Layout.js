import Navbar from "./Navbar";
import Footer from "./Footer";
import Image from "next/image";

import HeroBG from "../public/images/hero-bg.jpg";

const Layout = ({ children }) => {

  return (
    <div className="font-serif flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
