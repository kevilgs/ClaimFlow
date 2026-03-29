import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Mail, Settings, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  manager_id: string | null;
}

export default function TeamDirectory() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    manager_id: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const openNewModal = () => {
    setEditingUserId(null);
    setFormData({ name: "", email: "", role: "", manager_id: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUserId(String(user.id));
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      manager_id: user.manager_id ? String(user.manager_id) : "unassigned",
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/api/users/${deleteUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => String(u.id) !== String(deleteUser.id)));
        toast.success("User deleted successfully");
        setDeleteUser(null);
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user", error);
      toast.error("An error occurred while deleting the user");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const method = editingUserId ? "PUT" : "POST";
      const endpoint = editingUserId
        ? `http://localhost:3000/api/users/${editingUserId}`
        : "http://localhost:3000/api/users";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          manager_id: formData.manager_id === "unassigned" ? null : (formData.manager_id || null),
        }),
      });

      if (response.ok) {
        if (editingUserId) {
          const updatedUser = await response.json();
          setUsers((prev) => prev.map((u) => (String(u.id) === String(editingUserId) ? updatedUser : u)));
          toast.success("User updated successfully");
        } else if (response.status === 201) {
          const { tempPassword, user } = await response.json();
          setUsers((prev) => [...prev, user]);
          toast.success("Invite Sent", {
            description: `Email sent to ${user.email}! (Dev note: PWD is ${tempPassword})`,
          });
        }
        setIsModalOpen(false);
        setFormData({ name: "", email: "", role: "", manager_id: "" });
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.error || `Failed to ${editingUserId ? "update" : "create"} user`);
      }
    } catch (error) {
      console.error("Error saving user", error);
      toast.error("An error occurred while saving the user");
    }
  };

  const managers = users.filter((u) => u.role === "manager" || u.role === "admin");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Team Directory</h1>
        <Button onClick={openNewModal}>New</Button>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUserId ? "Edit User" : "Add New User"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="cfo">CFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Select
                  value={formData.manager_id}
                  onValueChange={(value) => setFormData({ ...formData, manager_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={String(manager.id)}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit">
                  {editingUserId ? "Save Changes" : "Send Password"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            Are you sure you want to delete <span className="font-semibold">{deleteUser?.name}</span>? This action cannot be undone.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const manager = users.find((u) => String(u.id) === String(user.manager_id));
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>{manager ? manager.name : "-"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/admin/rules', { state: { preSelectedUserId: user.id } })}
                        >
                          <Settings className="mr-2 h-3.5 w-3.5" />
                          Rules
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage User</DropdownMenuLabel>

                            <DropdownMenuItem onClick={() => openEditModal(user)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => toast(`Password reset email sent to ${user.email}`)}>
                              <Mail className="mr-2 h-4 w-4" /> Send Password
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => setDeleteUser(user)}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
