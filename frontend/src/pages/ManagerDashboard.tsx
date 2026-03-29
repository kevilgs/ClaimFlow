import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function ManagerDashboard() {
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchApprovals = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/api/expenses/manager', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingApprovals(data);
            }
        } catch (error) {
            toast.error("Failed to fetch approvals");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    const handleDecision = async (id: string, decision: "approved" | "rejected") => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/api/expenses/${id}/decide`, {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ decision })
            });

            if (res.ok) {
                toast.success(`Expense request ${decision}!`);
                setPendingApprovals(prev => prev.map(item =>
                    item.id === id ? { ...item, status: decision } : item
                ));
            } else {
                toast.error(`Failed to process decision.`);
            }
        } catch (error) {
            toast.error("An error occurred while communicating with the server.");
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === "approved" || status === "reimbursed") return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none transition-colors capitalize">{status}</Badge>;
        if (status === "rejected") return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none transition-colors capitalize">{status}</Badge>;
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none transition-colors">Pending</Badge>;
    };

    return (
        <div className="space-y-6 max-w-none w-full">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Approvals to review</h1>

            <div className="space-y-4">
                <div className="flex items-center">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search approvals..." className="pl-9 bg-white border-slate-200 text-sm shadow-sm" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-x-auto w-full">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-600">Approval Subject</TableHead>
                                <TableHead className="font-semibold text-slate-600">Request Owner</TableHead>
                                <TableHead className="font-semibold text-slate-600">Category</TableHead>
                                <TableHead className="font-semibold text-slate-600">Request Status</TableHead>
                                <TableHead className="font-semibold text-slate-600">Amount (Base)</TableHead>
                                <TableHead className="text-center font-semibold text-slate-600 w-[180px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-slate-900" />
                                        Loading approvals...
                                    </TableCell>
                                </TableRow>
                            ) : pendingApprovals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No approvals pending review.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pendingApprovals.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-medium text-slate-900">{req.subject}</TableCell>
                                        <TableCell className="text-slate-600">{req.owner}</TableCell>
                                        <TableCell className="text-slate-600 capitalize">{req.category.replace('_', ' ')}</TableCell>
                                        <TableCell>
                                            {getStatusBadge(req.status)}
                                        </TableCell>
                                        <TableCell className="text-slate-700">
                                            {req.originalCurrency !== req.baseCurrency ? (
                                                <>
                                                    <span className="text-red-500 font-medium">{req.originalAmount} {req.originalCurrency === "USD" ? "$" : req.originalCurrency}</span> <span className="text-slate-400 text-xs">(in {req.baseCurrency})</span> = <span className="font-semibold">{req.baseAmount}</span>
                                                </>
                                            ) : (
                                                <span className="font-semibold">{req.baseAmount} {req.baseCurrency}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="p-4">
                                            {(req.status === "submitted" || req.status === "pending_approval") ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 font-medium"
                                                        onClick={() => handleDecision(req.id, "approved")}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-medium"
                                                        onClick={() => handleDecision(req.id, "rejected")}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center text-sm text-slate-400 italic">
                                                    Read-only
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
