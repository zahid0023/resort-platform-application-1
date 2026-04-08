import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to login
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground">
          Enter your email and we'll send you a reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
