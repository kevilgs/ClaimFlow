import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [isForgotLoading, setIsForgotLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e: any) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Something went wrong")

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (data.user.role === "admin") {
        navigate("/admin")
      } else if (data.user.role === "manager") {
        navigate("/manager")
      } else {
        navigate("/employee")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: any) => {
    e.preventDefault()
    setIsForgotLoading(true)
    try {
      const res = await fetch("http://localhost:3000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      toast.success(data.message || "Reset link sent!")
      setShowForgot(false)
      setForgotEmail("")
    } catch {
      toast.error("Failed to send reset email. Please try again.")
    } finally {
      setIsForgotLoading(false)
    }
  }

  if (showForgot) {
    return (
      <AuthShell
        heading="Forgot password"
        subheading="Enter your email and we'll send you a reset link."
        footerText="Remember your password?"
        footerLink={{ label: "Back to sign in", href: "/login" }}
      >
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isForgotLoading}>
            {isForgotLoading ? "Sending..." : "Send reset link"}
          </Button>
          <button
            type="button"
            onClick={() => setShowForgot(false)}
            className="w-full text-sm text-slate-500 hover:text-slate-800 transition-colors text-center"
          >
            Back to sign in
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      heading="Sign in"
      subheading="Access your expense approvals and reimbursements."
      footerText="Don't have an account?"
      footerLink={{ label: "Sign up", href: "/signup" }}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  )
}