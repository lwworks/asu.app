import { Button } from "@/components/ui/button";
import { useCurrentTime } from "@/context/current-time";
import { cn } from "@/lib/cn";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState, type FormEvent } from "react";
import slugify from "slugify";
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

export const NewOperation = ({ className }: { className?: string }) => {
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
    const slug = slugify(
      `${format(createdAt, "yyyyMMdd-HHmm")}-${description}`,
      { lower: true, strict: true }
    );
    const recordKeeper = formData.get("record-keeper") as string;
    const operationId = crypto.randomUUID();
    const squadId = crypto.randomUUID();

    store.commit(
      events.operationCreated({
        id: operationId,
        description,
        slug,
        createdAt,
        recordKeeper,
      })
    );
    if (withFirstSquad) {
      store.commit(
        events.squadCreated({
          id: squadId,
          name: "Trupp 1",
          operationId,
          createdAt,
          status: "active",
          safetyTeam: false,
        })
      );
      store.commit(
        events.squadStarted({
          id: squadId,
          startedAt: currentTime,
        })
      );
      store.commit(
        events.squadLogCreatedWithText({
          id: crypto.randomUUID(),
          squadId,
          text: "Einsatz gestartet",
          timestamp: currentTime,
        })
      );
    }
    navigate({
      to: "/einsatz/$operationSlug",
      params: { operationSlug: slug },
    });
  };

  return (
    <Card className={cn("w-128 py-0", className)}>
      <CardHeader className="border-b pt-6 bg-white/4">
        <CardTitle className="text-2xl bold">Neuer Einsatz</CardTitle>
        <CardDescription>Starte einen neuen Einsatz.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="grow flex flex-col">
        <CardContent className="pb-6 grow">
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
        <CardFooter className="grid grid-cols-2 gap-2 border-t bg-white/4 pb-6">
          <Button type="submit" className="w-full order-2">
            Einsatz starten
          </Button>
          <Button
            type="submit"
            variant="outline"
            className="w-full order-1"
            onClick={() => setWithFirstSquad(true)}
          >
            Mit erstem Trupp starten
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
