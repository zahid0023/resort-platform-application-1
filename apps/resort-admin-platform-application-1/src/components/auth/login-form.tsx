"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { cn } from "@resort/shadcn-ui"
import { Button } from "@resort/shadcn-ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@resort/shadcn-ui"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import Link from "next/link"
import { login } from "@/services/auth"
import { ApiError } from "@/services/api"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ user_name: "", password: "" })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success(t("auth.login.successToast"))
      router.push("/dashboard")
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        toast.error(t("auth.login.invalidCredentialsToast"))
      } else {
        toast.error(t("auth.login.failToast"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t("auth.login.title")}</CardTitle>
          <CardDescription>
            {t("auth.login.desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="user_name">{t("auth.login.email")}</FieldLabel>
                <Input
                  id="user_name"
                  name="user_name"
                  type="email"
                  placeholder="email@example.com"
                  value={form.user_name}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">{t("auth.login.password")}</FieldLabel>
                  <Link href="/forgot-password" className="text-primary hover:underline">
                    {t("auth.login.forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? t("auth.login.submitting") : t("auth.login.submit")}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
