import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Users, Check, ChevronsUpDown, ShieldCheck } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    name: string;
    email: string;
    manager_id: string | null;
}

interface ApproverRow {
    tempId: string;
    userId: string;
    isRequired: boolean;
}

interface RuleForm {
    targetUserId: string;
    description: string;
    managerOverrideId: string;
    isManagerApprover: boolean;
    isSequential: boolean;
    minApprovalPercentage: number;
    approverRows: ApproverRow[];
}

export default function ApprovalRules() {
    const location = useLocation();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [ruleForm, setRuleForm] = useState<RuleForm>({
        targetUserId: "",
        description: "",
        managerOverrideId: "",
        isManagerApprover: false,
        isSequential: false,
        minApprovalPercentage: 100,
        approverRows: [],
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:3000/api/users", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAllUsers(data);

                    if (location.state?.preSelectedUserId) {
                        setRuleForm((prev) => ({
                            ...prev,
                            targetUserId: String(location.state.preSelectedUserId),
                        }));
                    }
                }
            } catch (error) {
                toast.error("Failed to fetch users");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [location.state]);

    useEffect(() => {
        if (ruleForm.targetUserId && allUsers.length > 0) {
            const selectedUser = allUsers.find(
                (u) => String(u.id) === ruleForm.targetUserId
            );
            if (selectedUser?.manager_id) {
                setRuleForm((prev) => ({
                    ...prev,
                    managerOverrideId: String(selectedUser.manager_id),
                }));
            } else {
                setRuleForm((prev) => ({ ...prev, managerOverrideId: "unassigned" }));
            }
        }
    }, [ruleForm.targetUserId, allUsers]);

    const handleAddApprover = () => {
        setRuleForm((prev) => ({
            ...prev,
            approverRows: [
                ...prev.approverRows,
                { tempId: crypto.randomUUID(), userId: "", isRequired: false },
            ],
        }));
    };

    const handleUpdateApprover = (
        tempId: string,
        field: keyof ApproverRow,
        value: any
    ) => {
        setRuleForm((prev) => ({
            ...prev,
            approverRows: prev.approverRows.map((row) =>
                row.tempId === tempId ? { ...row, [field]: value } : row
            ),
        }));
    };

    const handleRemoveApprover = (tempId: string) => {
        setRuleForm((prev) => ({
            ...prev,
            approverRows: prev.approverRows.filter((r) => r.tempId !== tempId),
        }));
    };

    const handleSave = () => {
        console.log("Saving Rule:", JSON.stringify(ruleForm, null, 2));
        toast.success("Approval Rule Saved!", {
            description: "The engine configuration has been updated successfully.",
        });
    };

    const UserCombobox = ({
        value,
        onChange,
        disabled = false,
    }: {
        value: string;
        onChange: (val: string) => void;
        disabled?: boolean;
    }) => {
        const [open, setOpen] = useState(false);
        const selectedUser = allUsers.find((u) => String(u.id) === value);

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal bg-white"
                        disabled={disabled || isLoading}
                    >
                        {value ? selectedUser?.name || "Unknown user" : "Select user..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search user..." />
                        <CommandList>
                            <CommandEmpty>No user found.</CommandEmpty>
                            <CommandGroup>
                                {allUsers.map((user) => (
                                    <CommandItem
                                        key={user.id}
                                        value={user.name}
                                        onSelect={() => {
                                            onChange(String(user.id));
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === String(user.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {user.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="max-w-6xl mx-auto space-y-4">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Configure Approval Rule
                    </h1>
                </div>

                {/* 12-Column Grid for Advanced Asymmetric Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: Rule Identity (Sticky) */}
                    <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-indigo-500" />
                                    Rule Identity
                                </CardTitle>
                                <CardDescription>
                                    Define who this rule applies to and describe its purpose.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Target User</Label>
                                    <UserCombobox
                                        value={ruleForm.targetUserId}
                                        onChange={(val) =>
                                            setRuleForm({ ...ruleForm, targetUserId: val })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        className="bg-white"
                                        placeholder="e.g. Finance department travel expenses"
                                        value={ruleForm.description}
                                        onChange={(e) =>
                                            setRuleForm({ ...ruleForm, description: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Approving Manager</Label>
                                    <Select
                                        value={ruleForm.managerOverrideId}
                                        onValueChange={(val) =>
                                            setRuleForm({ ...ruleForm, managerOverrideId: val })
                                        }
                                    >
                                        <SelectTrigger className="w-full bg-white">
                                            <SelectValue placeholder="Select manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">None / Use Default</SelectItem>
                                            {allUsers.map((u) => (
                                                <SelectItem key={u.id} value={String(u.id)}>
                                                    {u.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button size="lg" onClick={handleSave} className="w-full shadow-md text-md h-12">
                                <ShieldCheck className="mr-2 h-5 w-5" />
                                Save & Activate Rule
                            </Button>
                            <p className="text-xs text-slate-500 text-center px-4">
                                Changes take effect immediately across all active workflows.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: The Approval Engine */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        <Card className="shadow-sm border-slate-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">The Approval Engine</CardTitle>
                                <CardDescription>
                                    Configure sequence, approvers, and thresholds.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                {/* SECTION A: Specific Approvers */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-500/80 uppercase tracking-widest border-b pb-2">
                                        Specific Approvers
                                    </h3>

                                    <div className="flex items-center space-x-3 pt-2">
                                        <Checkbox
                                            id="managerApprover"
                                            checked={ruleForm.isManagerApprover}
                                            onCheckedChange={(c) =>
                                                setRuleForm({ ...ruleForm, isManagerApprover: !!c })
                                            }
                                            className="h-5 w-5"
                                        />
                                        <Label
                                            htmlFor="managerApprover"
                                            className="font-medium text-base text-slate-800 leading-none cursor-pointer"
                                        >
                                            Is manager an approver?
                                        </Label>
                                    </div>

                                    <div className="space-y-3 pt-3">
                                        {ruleForm.approverRows.map((row, index) => (
                                            <div
                                                key={row.tempId}
                                                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3 shadow-sm transition-all hover:border-slate-300 group"
                                            >
                                                <div
                                                    className={cn(
                                                        "flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm shrink-0 transition-colors",
                                                        ruleForm.isSequential
                                                            ? "text-slate-900 font-bold border-slate-300 border bg-white shadow-sm"
                                                            : "text-slate-500 font-medium"
                                                    )}
                                                >
                                                    {index + 1}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <UserCombobox
                                                        value={row.userId}
                                                        onChange={(val) =>
                                                            handleUpdateApprover(row.tempId, "userId", val)
                                                        }
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 px-3 shrink-0 border-l border-slate-100 ml-1 pl-4">
                                                    <Checkbox
                                                        id={`req-${row.tempId}`}
                                                        checked={row.isRequired}
                                                        onCheckedChange={(c) =>
                                                            handleUpdateApprover(row.tempId, "isRequired", !!c)
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`req-${row.tempId}`}
                                                        className="text-sm font-medium text-slate-600 whitespace-nowrap cursor-pointer hover:text-slate-900"
                                                    >
                                                        Required
                                                    </Label>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-slate-400 opacity-50 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8 transition-all"
                                                    onClick={() => handleRemoveApprover(row.tempId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            variant="outline"
                                            className="w-full border-dashed border-2 text-slate-500 hover:bg-slate-50 mt-4 h-12"
                                            onClick={handleAddApprover}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Add Approver
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Separator />
                                </div>

                                {/* SECTION B: Approval Logic */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold text-slate-500/80 uppercase tracking-widest border-b pb-2">
                                        Approval Logic
                                    </h3>

                                    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5 shadow-sm bg-white transition-all hover:border-slate-300">
                                        <div className="space-y-1">
                                            <Label className="text-base font-semibold text-slate-900">
                                                Approvers Sequence
                                            </Label>
                                            <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed">
                                                Require approvals strictly in the exact order listed above.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={ruleForm.isSequential}
                                            onCheckedChange={(c) =>
                                                setRuleForm({ ...ruleForm, isSequential: c })
                                            }
                                            className="data-[state=checked]:bg-indigo-600 scale-110 mr-2"
                                        />
                                    </div>

                                    <div className="space-y-3 pt-2 pb-4">
                                        <Label className="text-sm font-semibold text-slate-800">
                                            Minimum Approval Percentage
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="100"
                                                className="max-w-[120px] text-lg font-medium text-center bg-white"
                                                value={ruleForm.minApprovalPercentage}
                                                onChange={(e) =>
                                                    setRuleForm({
                                                        ...ruleForm,
                                                        minApprovalPercentage: Number(e.target.value),
                                                    })
                                                }
                                            />
                                            <span className="text-slate-500 font-medium text-lg">%</span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Percentage of required approvers that must sign off before finalizing.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
