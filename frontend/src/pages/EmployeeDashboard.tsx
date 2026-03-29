import { useState, useEffect, useRef } from "react";
import Tesseract from "tesseract.js";
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
    const [expenses, setExpenses] = useState([
        {
            id: "1",
            description: "Team Lunch at Pasta Palace",
            date: "2026-03-20",
            category: "Meals",
            paidBy: "Corporate Card",
            remarks: "Marketing team alignment",
            amount: 45.5,
            currency: "USD",
            status: "draft",
        },
        {
            id: "2",
            description: "Flight to London",
            date: "2026-03-22",
            category: "Travel",
            paidBy: "Personal Card",
            remarks: "Q2 Planning",
            amount: 850.0,
            currency: "GBP",
            status: "submitted",
        },
    ]);

    const [currencies, setCurrencies] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOcrLoading, setIsOcrLoading] = useState(false);
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

        setIsOcrLoading(true);
        toast.info("Scanning receipt...", { duration: 3000 });

        try {
            const { data: { text } } = await Tesseract.recognize(file, "eng", {
                logger: (m) => {
                    // Provide OCR logging
                },
            });

            const amounts = text.match(/\b\d+(\.\d{1,2})?\b/g);
            let extractedAmount = formData.amount;

            if (amounts && amounts.length > 0) {
                const floatAmounts = amounts.map(Number).filter((n) => !isNaN(n));
                extractedAmount = Math.max(...floatAmounts);
            }

            setFormData((prev) => ({
                ...prev,
                amount: extractedAmount,
                description: "Scanned Receipt",
            }));

            toast.success("Receipt parsed successfully!");
        } catch (error) {
            toast.error("Failed to parse receipt.");
        } finally {
            setIsOcrLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">Approved</Badge>;
            case "submitted":
            case "pending":
                return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">Submitted</Badge>;
            case "draft":
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none">Draft</Badge>;
            default:
                return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 capitalize border-none">{status}</Badge>;
        }
    };

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
                    <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-slate-200">
                        <div className="flex items-center justify-between p-6 bg-slate-50/50">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">To Submit</p>
                                <p className="text-2xl font-bold text-slate-900">1 Draft</p>
                            </div>
                            <ArrowRight className="h-6 w-6 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex items-center justify-between p-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">Waiting Approval</p>
                                <p className="text-2xl font-bold text-amber-600">1 Pending</p>
                            </div>
                            <ArrowRight className="h-6 w-6 text-slate-300 hidden md:block" />
                        </div>
                        <div className="flex items-center justify-between p-6">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-slate-500">Approved</p>
                                <p className="text-2xl font-bold text-green-600">0 Reimbursed</p>
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
                            {expenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-medium text-slate-900">{expense.description}</TableCell>
                                    <TableCell className="text-slate-600">{expense.date}</TableCell>
                                    <TableCell className="text-slate-600">{expense.category}</TableCell>
                                    <TableCell className="text-slate-600">{expense.paidBy}</TableCell>
                                    <TableCell className="text-slate-500 text-sm max-w-[150px] truncate">
                                        {expense.remarks}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-slate-900">
                                        {expense.amount.toFixed(2)} {expense.currency}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* New Expense Dialog */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-semibold">Create New Expense</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="flex flex-col gap-2 relative">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full h-24 border-dashed border-2 bg-slate-50 transition-colors",
                                    isOcrLoading ? "cursor-not-allowed opacity-80" : "hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isOcrLoading}
                            >
                                {isOcrLoading ? (
                                    <div className="flex flex-col items-center gap-2 text-indigo-600">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="font-medium">Scanning with AI...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Upload className="h-6 w-6" />
                                        <span className="font-medium">Upload Receipt (OCR)</span>
                                    </div>
                                )}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700">Description</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="e.g. Uber to Airport"
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700">Date</Label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="bg-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-700">Category</Label>
                            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                <SelectTrigger className="bg-white">
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

                        <div className="flex gap-4">
                            <div className="space-y-2 flex-1">
                                <Label className="text-slate-700">Amount</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    className="bg-white font-medium"
                                />
                            </div>
                            <div className="space-y-2 w-32">
                                <Label className="text-slate-700">Currency</Label>
                                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                                    <SelectTrigger className="bg-white">
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
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => {
                                toast.success("Saved as draft!");
                                setIsModalOpen(false);
                            }}
                            className="w-full sm:w-auto font-medium shadow-none bg-white"
                        >
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => {
                                toast.success("Expense submitted for approval!");
                                setIsModalOpen(false);
                            }}
                            className="w-full sm:w-auto font-medium"
                        >
                            Submit for Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
