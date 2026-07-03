import { Button } from "@resort/shadcn-ui";
import defaults from "./default.json";

export interface Hero1Props {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost";
}

const Hero1 = ({
  title = defaults.title,
  subtitle = defaults.subtitle,
  buttonText = defaults.buttonText,
  buttonVariant = defaults.buttonVariant as Hero1Props["buttonVariant"],
}: Hero1Props) => {
  return (
    <section className="flex flex-col justify-center items-center w-full min-h-screen text-center px-6">
      <div className="flex flex-col items-center gap-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-lg">{subtitle}</p>
        <Button variant={buttonVariant}>{buttonText}</Button>
      </div>
    </section>
  );
};

export default Hero1;
