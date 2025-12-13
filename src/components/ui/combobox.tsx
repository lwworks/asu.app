"use client";

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Option = {
  id: string;
  label: string;
  sublabel?: string;
};

const capitalize = (text: string) => {
  return text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function Combobox({
  options,
  value,
  setValue,
  placeholder,
  error,
}: {
  options: Option[];
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={!!error}
          className="w-[200px] justify-between font-normal"
        >
          {value === "" ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            value
          )}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-none p-0">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Suchen..."
          />
          <CommandList>
            <CommandEmpty className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => {
                  setValue(capitalize(search));
                  setSearch("");
                  setOpen(false);
                }}
              >
                <PlusIcon className="size-4" />
                <span>{capitalize(search)}</span>
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {options
                .sort((a, b) => a.label.localeCompare(b.label))
                .map(({ id, label, sublabel }) => (
                  <CommandItem
                    key={id}
                    value={label}
                    onSelect={(newValue) => {
                      setValue(newValue);
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === label ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="leading-tight">
                      <span>{label}</span>
                      {sublabel && (
                        <>
                          <br />
                          <span className="text-xs leading-tight text-muted-foreground/50">
                            {sublabel}
                          </span>
                        </>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
