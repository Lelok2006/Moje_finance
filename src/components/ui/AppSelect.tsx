"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import clsx from "clsx";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectGroup = {
  label: string;
  options: SelectOption[];
};

type AppSelectProps = {
  value: string;
  placeholder: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  onChange: (value: string) => void;
};

export default function AppSelect({
  value,
  placeholder,
  options,
  groups,
  onChange,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const flatOptions = [
    ...(options ?? []),
    ...(groups ?? []).flatMap((group) => group.options),
  ];
  const selected = flatOptions.find((option) => option.value === value);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={{ backgroundImage: "none" }}
        className={clsx(
          "select flex items-center justify-between gap-2 text-left",
          !selected && "text-neutral-400"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          size={14}
          className={clsx("text-neutral-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-[70] mt-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl"
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options?.map((option) => (
              <DropdownOption
                key={option.value}
                option={option}
                selected={option.value === value}
                onSelect={pick}
              />
            ))}
            {groups?.map((group) => (
              <div key={group.label}>
                <div className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase text-neutral-400">
                  {group.label}
                </div>
                {group.options.map((option) => (
                  <DropdownOption
                    key={option.value}
                    option={option}
                    selected={option.value === value}
                    onSelect={pick}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  option,
  selected,
  onSelect,
}: {
  option: SelectOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(option.value)}
      className={clsx(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
        selected
          ? "bg-brand-50 font-medium text-brand-600"
          : "text-neutral-700 hover:bg-neutral-50"
      )}
    >
      <Check size={12} className={selected ? "opacity-100" : "opacity-0"} />
      <span className="truncate">{option.label}</span>
    </button>
  );
}
