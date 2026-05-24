import React from "react";
import Sidebar from "./Sidebar";

function Layout({ children }) {
  return (
    <div className="app-shell min-h-screen bg-[var(--rn-bg)] dark:bg-slate-950">
      <Sidebar />

      <main className="app-main min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default Layout;


