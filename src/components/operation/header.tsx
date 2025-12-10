import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Logo } from "@/components/visuals/logo";
import { events } from "@/livestore/schema";
import type { Operation } from "@/livestore/schema/operation";
import { useStore } from "@livestore/react";
import { CheckIcon, PencilIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";
import { Field, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";

export const OperationHeader = ({ operation }: { operation: Operation }) => {
  const { store } = useStore();
  const [editRecordKeeper, setEditRecordKeeper] = useState(false);

  const handleSubmitRecordKeeper = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const recordKeeper = formData.get("record-keeper") as string;
    if (!recordKeeper) return;
    store.commit(
      events.recordKeeperUpdated({ id: operation.id, recordKeeper })
    );
    setEditRecordKeeper(false);
  };

  return (
    <header className="border-b h-16 flex items-center justify-between px-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Logo className="h-4 text-white" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Einsätze</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{operation.description}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center text-sm">
        <span className="mr-2.5">Überwachende/r:</span>
        {editRecordKeeper ? (
          <form
            className="flex items-center gap-2"
            onSubmit={handleSubmitRecordKeeper}
          >
            <Field>
              <FieldLabel htmlFor="record-keeper" className="sr-only">
                Überwachende/r
              </FieldLabel>
              <ButtonGroup>
                <Input
                  name="record-keeper"
                  id="record-keeper"
                  placeholder="Überwachende/r"
                  defaultValue={operation.recordKeeper ?? ""}
                  required
                  autoFocus
                />
                <Button type="submit" size="icon" variant="outline">
                  <CheckIcon className="size-4" />
                </Button>
              </ButtonGroup>
            </Field>
          </form>
        ) : (
          <>
            <span className="text-foreground">{operation.recordKeeper}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="hover:bg-transparent!"
              onClick={() => setEditRecordKeeper(true)}
            >
              <PencilIcon className="size-3" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
};
