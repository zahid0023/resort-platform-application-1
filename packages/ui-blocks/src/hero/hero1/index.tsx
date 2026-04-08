import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
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
    <Card className="bg-transparent flex justify-center items-center flex-col w-full h-full text-center shadow-none border-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant={buttonVariant}>{buttonText}</Button>
      </CardContent>
    </Card>
  );
};

export default Hero1;
