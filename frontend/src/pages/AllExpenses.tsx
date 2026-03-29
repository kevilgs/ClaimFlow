import { useEffect, useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


interface Expense {
    id: string;
    date: string;
    employeeName: string;
    description: string;
    amount: number;
    status: "draft" | "submitted" | "pending_approval" | "approved" | "rejected" | "reimbursed" | "cancelled" | string;
}

const MOCK_EXPENSES: Expense[] = [
    {
        id: "ex-1",
        date: "2026-03-25",
        employeeName: "Sarah Manager",
        description: "Client Dinner",
        amount: 150.00,
        status: "approved",
    },
    {
        id: "ex-2",
        date: "2026-03-28",
        employeeName: "Marc Employee",
        description: "Flight to NYC",
        amount: 450.00,
        status: "pending",
    },
    {
        id: "ex-3",
        date: "2026-03-20",
        employeeName: "John Doe",
        description: "Office Supplies",
        amount: 25.00,
        status: "rejected",
    },
];

export default function AllExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3000/api/expenses/all", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setExpenses(data);
                        return;
                    }
                }
                throw new Error("Empty or failed response");
            } catch (error) {
                // CRITICAL FALLBACK
                setExpenses(MOCK_EXPENSES);
                toast("Using mock data for layout testing.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchExpenses();
    }, []);

    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const matchesSearch = expense.employeeName
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || expense.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [expenses, searchQuery, statusFilter]);

    const getStatusBadge = (status: string) => {
        const displayStatus = status.replace('_', ' ');
        switch (status.toLowerCase()) {
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent shadow-none capitalize">
                        {displayStatus}
                    </Badge>
                );
            case "pending_approval":
            case "pending": // Fallback for any old mock data
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent shadow-none capitalize">
                        {displayStatus}
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-transparent shadow-none capitalize">
                        {displayStatus}
                    </Badge>
                );
            case "submitted":
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent shadow-none capitalize">
                        {displayStatus}
                    </Badge>
                );
            case "reimbursed":
                return (
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 border-transparent shadow-none capitalize">
                        {displayStatus}
                    </Badge>
                );
            case "draft":
            case "cancelled":
            default:
                return (
                    <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-transparent shadow-none capitalize">
                        {displayStatus}
                    </Badge>
                );
        }
    };

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Company Expenses Audit
                        </h1>
                        <p className="text-sm text-slate-500">
                            Review, filter, and audit company-wide expense submissions.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by employee..."
                                className="pl-9 bg-white shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="w-40">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="bg-white shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-slate-400" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="submitted">Submitted</SelectItem>
                                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="reimbursed">Reimbursed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* The Table */}
                <Card className="shadow-sm border-slate-200 border bg-white overflow-hidden">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50 border-b border-slate-100">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold text-slate-600">Date</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Employee</TableHead>
                                        <TableHead className="font-semibold text-slate-600">Description</TableHead>
                                        <TableHead className="font-semibold text-slate-600 text-right">Amount</TableHead>
                                        <TableHead className="font-semibold text-slate-600 pl-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                                Loading records...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredExpenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                                No expenses found matching your filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <TableRow key={expense.id} className="transition-colors hover:bg-slate-50/50">
                                                <TableCell className="text-slate-600 whitespace-nowrap">
                                                    {expense.date}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900">
                                                    {expense.employeeName}
                                                </TableCell>
                                                <TableCell className="text-slate-600 max-w-[200px] truncate">
                                                    {expense.description}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-slate-900">
                                                    ${expense.amount.toFixed(2)}
                                                </TableCell>
                                                <TableCell className="pl-6">
                                                    {getStatusBadge(expense.status)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
