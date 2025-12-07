import { Button } from "@/components/ui/button";
import { useCurrentTime } from "@/context/current-time";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export const NewOperation = () => {
  const { currentTime } = useCurrentTime();
  const [withFirstSquad, setWithFirstSquad] = useState<boolean>(false);
  const { store } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    let createdAt = currentTime;
    const startDate = formData.get("start-date") as string;
    if (startDate) createdAt = new Date(startDate);
    const description = formData.get("description") as string;
    const recordKeeper = formData.get("record-keeper") as string;
    const operationId = crypto.randomUUID();

    store.commit(
      events.operationCreated({
        id: operationId,
        description,
        createdAt,
        recordKeeper,
      })
    );
    if (withFirstSquad) {
      store.commit(
        events.squadCreated({
          id: crypto.randomUUID(),
          name: "Trupp 1",
          operationId,
          createdAt,
          status: "active",
          safetyTeam: false,
        })
      );
    }
    navigate({ to: "/einsatz/$operationId", params: { operationId } });
  };

  return (
    <section className="p-16">
      <Card className="max-w-lg">
        <CardHeader className="border-b">
          <CardTitle>Neuer Einsatz</CardTitle>
          <CardDescription>
            Starte einen neuen Einsatz. Wenn's schnell gehen muss, kannst Du
            auch direkt mit dem ersten Trupp starten.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pb-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="start-date">Startzeit</FieldLabel>
                <Input
                  id="start-date"
                  name="start-date"
                  placeholder={format(currentTime, "dd.MM.yyyy HH:mm")}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Bezeichnung</FieldLabel>
                <FieldDescription>
                  Kurze Bezeichnung oder Beschreibung des Einsatzes,
                  optimalerweise mit Einsatzort.
                </FieldDescription>
                <Input
                  id="description"
                  name="description"
                  placeholder="B3 Oerel"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="record-keeper">Überwachende/r</FieldLabel>
                <Input
                  id="record-keeper"
                  name="record-keeper"
                  placeholder="Max Mustermann"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="grid grid-cols-2 gap-2 border-t">
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              onClick={() => setWithFirstSquad(true)}
            >
              Mit erstem Trupp starten
            </Button>
            <Button type="submit" className="w-full">
              Einsatz starten
            </Button>
          </CardFooter>
        </form>
      </Card>
    </section>
  );
};
