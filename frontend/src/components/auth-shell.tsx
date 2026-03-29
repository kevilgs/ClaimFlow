import type { PropsWithChildren } from "react"

interface AuthShellProps extends PropsWithChildren {
  heading: string
  subheading: string
  footerText?: string
  footerLink?: { label: string; href: string }
}

export function AuthShell({ heading, subheading, footerText, footerLink, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_480px]">
        <div className="hidden items-center justify-center border-r border-slate-200 bg-slate-50 px-10 lg:flex">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">CF</div>
              <div className="space-y-1">
                <p className="text-xl font-semibold">ClaimFlow</p>
                <p className="text-sm text-slate-600">Expense & Approval Workspace</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-slate-700">
              <p className="text-base font-medium">Aligned teams, faster reimbursements.</p>
              <p className="text-sm text-slate-600">Track requests, approvals, and payouts in one calm, reliable place.</p>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                <span>Live status across offices.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 space-y-2 text-center">
              <p className="text-sm font-semibold text-slate-500">ClaimFlow</p>
              <h1 className="text-2xl font-semibold">{heading}</h1>
              <p className="text-sm text-slate-500">{subheading}</p>
            </div>
            {children}
            {footerText && footerLink && (
              <p className="mt-6 text-center text-sm text-slate-500">
                {footerText}{" "}
                <a href={footerLink.href} className="font-semibold text-slate-900 hover:underline">
                  {footerLink.label}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
