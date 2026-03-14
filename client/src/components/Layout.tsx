import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Factory, 
  Eye, 
  Menu,
  ChevronLeft,
  Settings,
  Bell
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      path: "/",
      label: "대시보드",
      icon: LayoutDashboard,
      description: "생산 및 품질 현황"
    },
    {
      path: "/production",
      label: "작업실적입력",
      icon: Factory,
      description: "생산 실적 등록"
    },
    {
      path: "/vision",
      label: "AI 비전 검사",
      icon: Eye,
      description: "불량 감지 모니터링"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#0f172a] text-slate-300 flex flex-col transition-all duration-300 shadow-xl z-30 fixed h-full lg:relative border-r border-slate-800",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-[#020617]">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg shadow-blue-900/50 shadow-lg">AI</div>
              <div>
                <div className="font-bold text-lg tracking-tight leading-none">SmartFactory</div>
                <div className="text-[10px] text-blue-400 font-medium">VISION SYSTEM</div>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-lg">AI</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30" 
                      : "hover:bg-slate-800 hover:text-white"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-300", 
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                  
                  {sidebarOpen && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="font-semibold text-sm">{item.label}</span>
                      <span className={cn("text-[10px] truncate max-w-[140px]", isActive ? "text-blue-200" : "text-slate-500 group-hover:text-slate-400")}>
                        {item.description}
                      </span>
                    </div>
                  )}
                  
                  {/* Active Indicator Bar */}
                  {!sidebarOpen && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer User Profile */}
        <div className="p-4 border-t border-slate-800 bg-[#020617]">
          <div className={cn("flex items-center gap-3", !sidebarOpen && "justify-center")}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-slate-800">
                AD
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#020617] rounded-full"></div>
            </div>
            
            {sidebarOpen && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-white truncate">Administrator</span>
                <span className="text-xs text-slate-500 truncate">System Manager</span>
              </div>
            )}
            
            {sidebarOpen && (
               <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800 h-8 w-8">
                 <Settings className="w-4 h-4" />
               </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        !sidebarOpen && "lg:ml-0"
      )}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:bg-slate-100"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="font-bold text-lg text-slate-800 hidden sm:block">
              {menuItems.find(item => item.path === location)?.label || "AI Vision ERP"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 relative">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </Button>
             <div className="h-8 w-px bg-slate-200 mx-1"></div>
             <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-500">서울 공장 (Seoul Factory)</div>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
