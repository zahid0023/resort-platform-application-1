"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@resort/shadcn-ui";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@resort/shadcn-ui";
import { Input } from "@resort/shadcn-ui";
import { Spinner } from "@resort/shadcn-ui";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      // simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast("You submitted the following values:", {
        description: (
          <pre className="mt-2 w-[320px] overflow-x-auto rounded-md p-4">
            <code className="text-muted-foreground">
              {JSON.stringify({ email }, null, 2)}
            </code>
          </pre>
        ),
        position: "bottom-right",
        classNames: {
          content: "flex flex-col gap-2",
        },
        style: {
          "--border-radius": "calc(var(--radius)  + 4px)",
        } as React.CSSProperties,
      });

      setEmail(""); // reset form
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        disabled={isSubmitting || !email}
        className="mt-4 w-full"
      >
        {isSubmitting && <Spinner />}
        {t("auth.forgotPassword.submit")}
      </Button>
    </form>
  );
}
