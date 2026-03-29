import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Upload, Loader2, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isFetchingExpenses, setIsFetchingExpenses] = useState(true);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('http://localhost:3000/api/expenses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
        } catch (error) {
            toast.error("Failed to fetch expenses");
        } finally {
            setIsFetchingExpenses(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const submitDraft = async (id: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:3000/api/expenses/${id}/submit`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Expense submitted for approval!");
                setExpenses(prev => prev.map(exp => String(exp.id) === String(id) ? { ...exp, status: "submitted" } : exp));
            } else {
                const json = await res.json();
                toast.error(json.error || "Failed to submit draft");
            }
        } catch (error) {
            toast.error("An error occurred while submitting draft");
        }
    };

    const [currencies, setCurrencies] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        description: "",
        date: "",
        category: "",
        currency: "USD",
        amount: 0,
        remarks: "",
    });

    useEffect(() => {
        fetch("https://restcountries.com/v3.1/all?fields=currencies")
            .then((res) => res.json())
            .then((data) => {
                const codes = new Set<string>();
                data.forEach((country: any) => {
                    if (country.currencies) {
                        Object.keys(country.currencies).forEach((code) =>
                            codes.add(code.toUpperCase())
                        );
                    }
                });
                setCurrencies(Array.from(codes).sort());
            })
            .catch(() => setCurrencies(["USD", "EUR", "GBP", "INR", "AUD", "CAD"]));
    }, []);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPreviewUrl(URL.createObjectURL(file));
        setIsOcrLoading(true);
        toast.info("Scanning receipt...", { duration: 3000 });

        try {
            const uploadData = new FormData();
            uploadData.append('receipt', file);

            const res = await fetch('http://localhost:3000/api/ocr', {
                method: 'POST',
                body: uploadData
            });
            const json = await res.json();

            if (json.success) {
                setFormData((prev) => ({
                    ...prev,
                    amount: json.data.amount ?? prev.amount,
                    currency: json.data.currency ?? prev.currency,
                    date: json.data.date ?? prev.date,
                    description: json.data.description ?? prev.description,
                    category: json.data.category ?? prev.category,
                }));
                toast.success("Receipt parsed successfully!");
            } else {
                toast.error("Failed to parse receipt.");
            }
        } catch (error) {
            toast.error("Failed to upload receipt.");
        } finally {
            setIsOcrLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSaveExpense = async (status: "draft" | "submitted") => {
        if (!formData.description || !formData.date || !formData.category || !formData.amount) {
            toast.error("Please fill in all required fields to submit.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            // Always create as draft first
            const res = await fetch('http://localhost:3000/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, status: 'draft' })
            });

            if (!res.ok) {
                toast.error("Failed to create expense.");
                return;
            }

            const created = await res.json();

            if (status === "submitted") {
                // Now trigger the submit endpoint which builds the approval queue
                const submitRes = await fetch(`http://localhost:3000/api/expenses/${created.id}/submit`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (submitRes.ok) {
                    toast.success("Expense submitted for approval!");
                } else {
                    const json = await submitRes.json();
                    toast.error(json.error || "Failed to submit for approval.");
                    return;
                }
            } else {
                toast.success("Saved as draft!");
            }

            setIsModalOpen(false);
            setFormData({
                description: "",
                date: "",
                category: "",
                currency: "USD",
                amount: 0,
                remarks: "",
            });
            setPreviewUrl(null);
            fetchExpenses();
        } catch (error) {
            toast.error("An error occurred while saving the expense.");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
            case "reimbursed":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none capitalize">{status}</Badge>;
            case "submitted":
            case "pending_approval":
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">Pending</Badge>;
            case "rejected":
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none">Rejected</Badge>;
            case "draft":
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">Draft</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 capitalize border-none">{status}</Badge>;
        }
    };

    const calculateTotal = (statuses: string[]) => {
        return expenses
            .filter(e => statuses.includes(e.status))
            .reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount || "0")), 0)
            .toFixed(2);
    };

    const draftTotal = calculateTotal(['draft']);
    const pendingTotal = calculateTotal(['submitted', 'pending_approval']);
    const approvedTotal = calculateTotal(['approved', 'reimbursed']);
    const rejectedTotal = calculateTotal(['rejected']);

    return (
        <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Expenses</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Expense
                </Button>
            </div>

            {/* Metric Banner */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-4 md:divide-x divide-y md:divide-y-0 divide-slate-200">
                        <div className="flex items-center justify-between p-6 bg-slate-50/50">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">To Submit</p>
                                <p className="text-2xl font-bold text-slate-900">${draftTotal}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex items-center justify-between p-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">Waiting Approval</p>
                                <p className="text-2xl font-bold text-amber-600">${pendingTotal}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex items-center justify-between p-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">Approved</p>
                                <p className="text-2xl font-bold text-green-600">${approvedTotal}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex items-center justify-between p-6 bg-red-50/30">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">Rejected</p>
                                <p className="text-2xl font-bold text-red-600">${rejectedTotal}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-slate-600">Description</TableHead>
                                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                                <TableHead className="font-semibold text-slate-600">Category</TableHead>
                                <TableHead className="font-semibold text-slate-600">Paid By</TableHead>
                                <TableHead className="font-semibold text-slate-600">Remarks</TableHead>
                                <TableHead className="text-right font-semibold text-slate-600">Amount</TableHead>
                                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetchingExpenses ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-indigo-500" />
                                        Loading expenses...
                                    </TableCell>
                                </TableRow>
                            ) : expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                        No expenses found. Start by creating a new expense!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-medium text-slate-900">{expense.description}</TableCell>
                                        <TableCell className="text-slate-600">{expense.date}</TableCell>
                                        <TableCell className="text-slate-600 capitalize">{expense.category?.replace('_', ' ')}</TableCell>
                                        <TableCell className="text-slate-600 capitalize">{expense.paidBy?.replace('_', ' ')}</TableCell>
                                        <TableCell className="text-slate-500 text-sm max-w-[150px] truncate">
                                            {expense.remarks}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-slate-900">
                                            {typeof expense.amount === 'number' ? expense.amount.toFixed(2) : parseFloat(expense.amount).toFixed(2)} {expense.currency}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(expense.status)}
                                                {expense.status === 'draft' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs px-2 font-medium"
                                                        onClick={() => submitDraft(expense.id)}
                                                    >
                                                        Submit
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* New Expense Dialog */}
            <Dialog open={isModalOpen} onOpenChange={(val) => { setIsModalOpen(val); if (!val) setPreviewUrl(null); }}>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-5 md:h-[600px]">
                        {/* LEFT COLUMN: Receipt and OCR */}
                        <div
                            className="col-span-2 bg-slate-100 border-r border-slate-200 p-6 flex flex-col items-center justify-center relative cursor-pointer hover:bg-slate-200/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <div className="absolute inset-0 p-4 pb-20 flex flex-col items-center justify-center">
                                    <img src={previewUrl} alt="Receipt Preview" className="w-full h-full object-contain rounded-md border border-slate-200 shadow-sm bg-white" />
                                    {isOcrLoading && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 transition-all">
                                            <Loader2 className="h-8 w-8 animate-spin text-slate-900 mb-3" />
                                            <span className="font-semibold text-slate-800">Reading Receipt...</span>
                                            <span className="text-xs text-slate-500 mt-1">Extracting amounts and dates</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center space-y-3 w-full max-w-[200px]">
                                    <div className="mx-auto bg-slate-200 h-16 w-16 rounded-full flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-lg">Upload Receipt</h3>
                                    <p className="text-sm text-slate-500">Scan via AI to auto-fill</p>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                    handleFileUpload(e);
                                    e.stopPropagation();
                                }}
                            />

                            <Button
                                className={cn("w-[90%] absolute bottom-6 shadow-sm pointer-events-none", previewUrl ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-50" : "")}
                                variant={previewUrl ? "outline" : "default"}
                                disabled={isOcrLoading}
                            >
                                {isOcrLoading ? "Scanning..." : previewUrl ? "Upload Different Receipt" : "Browse Files..."}
                            </Button>
                        </div>

                        {/* RIGHT COLUMN: Form */}
                        <div className="col-span-3 bg-white p-6 md:p-8 flex flex-col max-h-[600px] overflow-y-auto">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-2xl font-bold text-slate-900">Expense Details</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-5 flex-1 pr-2">
                                <div className="space-y-2">
                                    <Label className="text-slate-700">Description</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="e.g. Uber to Airport"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Date</Label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Category</Label>
                                        <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Meals">Meals</SelectItem>
                                                <SelectItem value="Travel">Travel</SelectItem>
                                                <SelectItem value="Software">Software</SelectItem>
                                                <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Amount</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className="font-medium text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700">Currency</Label>
                                        <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="USD" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currencies.slice(0, 150).map((c) => (
                                                    <SelectItem key={c} value={c}>
                                                        {c}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-slate-700">Remarks (Optional)</Label>
                                    <Input
                                        value={formData.remarks}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                        placeholder="Additional details..."
                                    />
                                </div>
                            </div>

                            <DialogFooter className="mt-8 pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSaveExpense("draft")}
                                    className="w-full sm:w-auto font-medium shadow-none bg-white"
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    onClick={() => handleSaveExpense("submitted")}
                                    className="w-full sm:w-auto font-medium"
                                >
                                    Submit for Approval
                                </Button>
                            </DialogFooter>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
