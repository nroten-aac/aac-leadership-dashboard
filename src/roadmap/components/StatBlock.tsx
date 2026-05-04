interface Props { value: string | number; label: string; gold?: boolean; }
export default function StatBlock({ value, label, gold }: Props) {
  return (
    <div>
      <div className={`font-display text-5xl font-black leading-none ${gold ? "gradient-gold-text" : "text-foreground"}`}>
        {value}
      </div>
      <div className="eyebrow mt-2 text-[10px]">{label}</div>
    </div>
  );
}
