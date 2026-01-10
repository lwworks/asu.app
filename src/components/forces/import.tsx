import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { forceByNameAndOrganization$ } from "@/livestore/queries/force/force-by-name-and-organization";
import { events } from "@/livestore/schema";
import { useStore } from "@livestore/react";
import { Link } from "@tanstack/react-router";
import { isSameDay, parse } from "date-fns";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { useState, type FormEvent } from "react";
import readXlsxFile from "read-excel-file";
import { Button } from "../ui/button";

const formatOptions = [
  { label: "CSV-Datei", value: "csv" },
  { label: "FeuerOn-Export", value: "feueron" },
];

export const ImportForces = () => {
  const [format, setFormat] = useState<string>("feueron");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { store } = useStore();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      if (loading) return;
      setLoading(true);
      setError(null);
      setSuccess(null);
      const formData = new FormData(event.target as HTMLFormElement);
      const file = formData.get("file") as File;
      const data = await readXlsxFile(file);
      if (format === "feueron") {
        if (data.slice(5).length === 0) {
          throw new Error("Die Datei enthält keine Daten.");
        }
        for (const row of data.slice(5)) {
          const annualTraining = parse(
            row[4] as string,
            "dd.MM.yyyy",
            new Date()
          );
          const medicalCheck = parse(
            row[5] as string,
            "dd.MM.yyyy",
            new Date()
          );
          const force = store.query(
            forceByNameAndOrganization$(row[0] as string, row[2] as string)
          );
          if (force.length === 0) {
            store.commit(
              events.forceCreated({
                id: crypto.randomUUID(),
                name: row[0] as string,
                organization: row[2] as string,
                annualTraining,
                medicalCheck,
                updatedAt: new Date(),
              })
            );
          } else {
            const annualTrainingUpdated =
              force[0].annualTraining &&
              !isSameDay(force[0].annualTraining, annualTraining);
            const medicalCheckUpdated =
              force[0].medicalCheck &&
              !isSameDay(force[0].medicalCheck, medicalCheck);
            if (annualTrainingUpdated || medicalCheckUpdated) {
              store.commit(
                events.forceUpdated({
                  id: force[0].id,
                  name: row[0] as string,
                  organization: row[2] as string,
                  annualTraining,
                  medicalCheck,
                  updatedAt: new Date(),
                })
              );
            }
          }
        }
      }
      setSuccess(`${data.slice(5).length} Einträge importiert.`);
    } catch (error) {
      console.error(error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="py-0 w-full">
      <CardHeader className="border-b pt-6 bg-white/4">
        <CardTitle className="text-2xl">Import</CardTitle>
        <CardDescription>
          Importiere Personal aus einer CSV-Datei.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="pb-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="format">Format</FieldLabel>
              <Select
                name="format"
                required
                value={format}
                onValueChange={setFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Format auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="file">Datei</FieldLabel>
              {format === "feueron" && (
                <FieldDescription>
                  Hier findest Du eine{" "}
                  <Link to="/">Anleitung zum Export aus FeuerOn</Link>.
                </FieldDescription>
              )}
              {format === "csv" && (
                <FieldDescription>
                  Hier findest Du eine{" "}
                  <Link to="/">Beispiel-Datei mit der korrekten Struktur</Link>.
                </FieldDescription>
              )}
              <Input
                type="file"
                id="file"
                name="file"
                required
                className="p-0 border-none bg-transparent! text-muted-foreground h-8 cursor-pointer file:bg-secondary file:hover:bg-secondary/80 file:text-secondary-foreground file:px-3 file:rounded-md file:font-medium file:inline-flex file:items-center file:mr-3 file:h-8"
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex justify-between gap-4 border-t bg-white/4 pb-6">
          <div>
            {error && (
              <p className="text-destructive text-xs font-normal flex items-center gap-1">
                <AlertCircleIcon className="size-4 shrink-0" />
                <span className="line-clamp-1">{error}</span>
              </p>
            )}
            {success && (
              <p className="text-primary text-xs font-normal flex items-center gap-1">
                <CheckCircle2Icon className="size-4 shrink-0" />
                <span className="line-clamp-1">{success}</span>
              </p>
            )}
          </div>
          <Button type="submit" variant="secondary">
            Personal aus Datei importieren
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
