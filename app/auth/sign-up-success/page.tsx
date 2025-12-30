import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Store, Mail, ArrowRight } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Mail className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;ve sent you a confirmation link. Please check your email to verify your account.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link href="/auth/login">
            <Button className="w-full h-12 font-medium">
              Go to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          {/* <Link href="/">
            <Button variant="ghost" className="w-full">
              <Store className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link> */}
        </div>
      </div>
    </div>
  )
}
