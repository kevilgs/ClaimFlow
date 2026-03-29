import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthShell } from "@/components/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [baseCurrency, setBaseCurrency] = useState("")
  const [countriesList, setCountriesList] = useState<{ name: string; currency: string }[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name,currencies")
      .then((res) => res.json())
      .then((data) => {
        const mappedCountries = data
          .filter((c: any) => c.name?.common && c.currencies)
          .map((c: any) => {
            const currencyCode = Object.keys(c.currencies)[0] || ""
            return {
              name: c.name.common,
              currency: currencyCode,
            }
          })
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
        setCountriesList(mappedCountries)
      })
      .catch((err) => console.error("Failed to load countries", err))
  }, [])

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryName = e.target.value
    setSelectedCountry(countryName)
    const found = countriesList.find((c) => c.name === countryName)
    if (found) {
      setBaseCurrency(found.currency)
    } else {
      setBaseCurrency("")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      return setError("Passwords do not match")
    }

    if (!selectedCountry || !baseCurrency) {
      return setError("Please select a valid country")
    }

    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:3000/api/signup", {        
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, country: selectedCountry, base_currency: baseCurrency }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Something went wrong")   

      localStorage.setItem("token", data.token)
      navigate("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      heading="Create your account"
      subheading="Set up your company admin profile to get started."
      footerText="Already have an account?"
      footerLink={{ label: "Sign in", href: "/login" }}
    >
      <form onSubmit={handleSignup} className="space-y-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedCountry}
            onChange={handleCountryChange}
            required
          >
            <option value="" disabled>Select your country</option>
            {countriesList.map((country) => (
              <option key={country.name} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
          {baseCurrency && <p className="text-xs text-slate-500">Company Base Currency: {baseCurrency}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>
    </AuthShell>
  )
}
