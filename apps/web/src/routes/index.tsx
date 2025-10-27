import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2Icon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeComponent
});

function HomeComponent() {
  return (
    <main>
      <Alert>
        <CheckCircle2Icon />
        <AlertTitle>Success! Your changes have been saved</AlertTitle>
        <AlertDescription>
          This is an alert with icon, title and description.
        </AlertDescription>
      </Alert>
    </main>
  );
}
