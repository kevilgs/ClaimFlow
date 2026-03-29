import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

export default function ManagerLayout() {
    const navigate = useNavigate();
    const [userName] = useState<string>(() => {
        try { return JSON.parse(localStorage.getItem("user") || "{}")?.name || "Manager"; }
        catch { return "Manager"; }
    });

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 text-white font-bold text-sm">
                        CF
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Manager Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">
                        Hello, {userName} 👋
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>
            <main className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6">
                    <Outlet />
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
}
