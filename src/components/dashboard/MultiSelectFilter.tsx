import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectFilterProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  width?: string;
}

const MultiSelectFilter = ({ label, options, selected, onChange, width = "w-[120px]" }: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  const displayText =
    selected.length === 0
      ? `All ${label}`
      : selected.length <= 2
        ? selected.map((v) => options.find((o) => o.value === v)?.label ?? v).join(", ")
        : `${selected.length} selected`;

  return (
    <div ref={ref} className={cn("relative", width)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full h-8 px-3 text-xs rounded-xl border border-border/50 bg-background hover:bg-accent/50 transition-colors"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 ml-1 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[140px] rounded-xl border border-border bg-popover shadow-md py-1 max-h-52 overflow-y-auto">
          <button
            onClick={() => onChange([])}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors"
          >
            <span className={cn("h-3.5 w-3.5 rounded border border-border flex items-center justify-center", selected.length === 0 && "bg-primary border-primary")}>
              {selected.length === 0 && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </span>
            All {label}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors"
            >
              <span className={cn("h-3.5 w-3.5 rounded border border-border flex items-center justify-center", selected.includes(opt.value) && "bg-primary border-primary")}>
                {selected.includes(opt.value) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
