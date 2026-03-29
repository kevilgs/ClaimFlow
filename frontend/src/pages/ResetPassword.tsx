import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get("token")

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!token) {
            toast.error("Invalid reset link.")
            navigate("/login")
        }
    }, [token, navigate])

    const handleReset = async (e: any) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.")
            return
        }
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters.")
            return
        }
        setIsLoading(true)
        try {
            const res = await fetch("http://localhost:3000/api/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Reset failed")
            toast.success("Password reset! Redirecting to sign in...")
            setTimeout(() => navigate("/login"), 1500)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AuthShell
            heading="Set new password"
            subheading="Choose a strong password for your account."
            footerText="Remembered it?"
            footerLink={{ label: "Back to sign in", href: "/login" }}
        >
            <form onSubmit={handleReset} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
            </form>
        </AuthShell>
    )
}
