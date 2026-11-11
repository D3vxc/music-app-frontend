import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import PlayerBar from "./PlayerBar";
import MobileNav from "./MobileNav";

export default function Layout() {
  const mainRef = useRef(null);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    setScrolled(false);
  }, [location.pathname]);

  return (
    <div className="app">
      <Sidebar />
      <main className="panel main" ref={mainRef} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 40)}>
        <TopBar solid={scrolled} />
        <div className="page">
          <Outlet />
        </div>
      </main>
      <PlayerBar />
      <MobileNav />
    </div>
  );
}
