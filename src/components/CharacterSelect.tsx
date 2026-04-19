import { Character, CHARACTERS } from "@/data/characters";
import { cn } from "@/lib/utils";

interface Props {
  selected: Character | null;
  onSelect: (c: Character) => void;
  label: string;
  disabled?: boolean;
}

export default function CharacterSelect({ selected, onSelect, label, disabled }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold tracking-widest uppercase text-center" style={{ color: "#a78bfa" }}>
        {label}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {CHARACTERS.map((c) => (
          <button
            key={c.id}
            disabled={disabled}
            onClick={() => onSelect(c)}
            className={cn(
              "relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-200 group",
              selected?.id === c.id
                ? "border-white scale-105 shadow-lg"
                : "border-white/10 hover:border-white/40 hover:scale-102",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              background:
                selected?.id === c.id
                  ? `linear-gradient(135deg, ${c.colorHex}33, ${c.colorHex}11)`
                  : "rgba(255,255,255,0.03)",
              boxShadow:
                selected?.id === c.id ? `0 0 16px ${c.colorHex}55` : undefined,
            }}
          >
            <span className="text-2xl">{c.emoji}</span>
            <span
              className="text-[10px] font-bold leading-tight text-center"
              style={{ color: selected?.id === c.id ? c.colorHex : "#94a3b8" }}
            >
              {c.name}
            </span>
            {selected?.id === c.id && (
              <span
                className="absolute -top-1 -right-1 text-[8px] font-black px-1 rounded"
                style={{ background: c.colorHex, color: "#000" }}
              >
                ВЫБ
              </span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="rounded-xl p-3 border border-white/10"
          style={{
            background: `linear-gradient(135deg, ${selected.colorHex}22, transparent)`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selected.emoji}</span>
            <div>
              <p className="font-black text-white text-sm">{selected.name}</p>
              <p className="text-[10px]" style={{ color: selected.colorHex }}>
                {selected.description} · {selected.style}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { label: "СКОРОСТЬ", val: selected.speed },
              { label: "СИЛА", val: selected.power },
              { label: "ЗАЩИТА", val: selected.defense },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[9px] text-white/40 font-bold tracking-wider">{s.label}</p>
                <div className="flex gap-0.5 justify-center mt-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: i < s.val ? selected.colorHex : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div
            className="text-[10px] font-bold text-center px-2 py-1 rounded-lg"
            style={{ background: `${selected.colorHex}33`, color: selected.colorHex }}
          >
            ✨ СПЕЦПРИЁМ: {selected.special} [{selected.specialKey}]
          </div>
        </div>
      )}
    </div>
  );
}
