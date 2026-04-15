import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-bold text-2xl">Create your account</h1>
        <p className="text-muted-foreground">
          Start building with Resort today
        </p>
      </div>

      <RegisterForm />
      
      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}