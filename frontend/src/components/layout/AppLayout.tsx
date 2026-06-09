import { Outlet } from "react-router-dom";
import IconNav from "./IconNav";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <IconNav />
      <div className="w-72 border-r border-gray-200 overflow-y-auto bg-white shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
