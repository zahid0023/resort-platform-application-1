"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@resort/shadcn-ui"
import { Input } from "@resort/shadcn-ui"
import { register } from "@/services/auth"

export function RegisterForm({ ...props }: React.ComponentProps<typeof Card>) {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    user_name: "",
    password: "",
    confirm_password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success(t("auth.register.successToast"))
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.register.failToast"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("auth.register.title")}</CardTitle>
        <CardDescription>
          {t("auth.register.desc")}
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
              <FieldDescription>
                {t("auth.register.emailDesc")}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{t("auth.login.password")}</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <FieldDescription>
                {t("auth.register.passwordDesc")}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                {t("auth.register.confirmPassword")}
              </FieldLabel>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
              <FieldDescription>{t("auth.register.confirmPasswordDesc")}</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? t("auth.register.submitting") : t("auth.register.submit")}
                </Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
