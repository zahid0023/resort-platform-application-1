"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { register } from "@/services/auth"

export function RegisterForm({ ...props }: React.ComponentProps<typeof Card>) {
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
      toast.success("User registered successfully!")
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user_name">Email</FieldLabel>
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
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
