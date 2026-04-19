import { Character, CHARACTERS, RARITY_CONFIG } from "@/data/characters";
import { cn } from "@/lib/utils";

interface Props {
  selected: Character | null;
  onSelect: (c: Character) => void;
  label: string;
  disabled?: boolean;
  availableChars?: Character[];
}

export default function CharacterSelect({ selected, onSelect, label, disabled, availableChars }: Props) {
  const chars = availableChars || CHARACTERS;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold tracking-widest uppercase text-center" style={{ color: "#a78bfa" }}>
        {label} <span className="text-white/30">({chars.length})</span>
      </p>
      <div className="grid grid-cols-4 gap-2">
        {chars.map((c) => {
          const cfg = RARITY_CONFIG[c.rarity];
          return (
            <button
              key={c.id}
              disabled={disabled}
              onClick={() => onSelect(c)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-200",
                selected?.id === c.id
                  ? "border-white scale-105 shadow-lg"
                  : "border-white/10 hover:border-white/40 hover:scale-105",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                background: selected?.id === c.id
                  ? `linear-gradient(135deg, ${c.colorHex}33, ${c.colorHex}11)`
                  : `linear-gradient(135deg, ${cfg.glow}, transparent)`,
                boxShadow: selected?.id === c.id ? `0 0 16px ${c.colorHex}55` : undefined,
              }}
            >
              <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${c.colorHex})` }}>{c.emoji}</span>
              <span className="text-[9px] font-bold leading-tight text-center"
                style={{ color: selected?.id === c.id ? c.colorHex : "#94a3b8" }}>
                {c.name}
              </span>
              {/* Rarity dot */}
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
              {selected?.id === c.id && (
                <span className="absolute -top-1 -right-1 text-[8px] font-black px-1 rounded"
                  style={{ background: c.colorHex, color: "#000" }}>
                  ВЫБ
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-xl p-3 border border-white/10"
          style={{ background: `linear-gradient(135deg, ${selected.colorHex}22, transparent)` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl" style={{ filter: `drop-shadow(0 0 10px ${selected.colorHex})` }}>{selected.emoji}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-black text-white text-sm">{selected.name}</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                  style={{ background: RARITY_CONFIG[selected.rarity].glow, color: RARITY_CONFIG[selected.rarity].color }}>
                  {RARITY_CONFIG[selected.rarity].star} {RARITY_CONFIG[selected.rarity].label}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: selected.colorHex }}>
                {selected.origin} · {selected.style}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[
              { label: "СИЛА",     val: selected.power,    max: 10 },
              { label: "СКОРОСТЬ", val: selected.speed,    max: 10 },
              { label: "ЗАЩИТА",   val: selected.defense,  max: 10 },
              { label: "ЛОВКОСТЬ", val: selected.agility,  max: 10 },
              { label: "КРИТ",     val: selected.critChance, max: 50, isPercent: true },
              { label: "HP",       val: selected.maxHP,    max: 200, isRaw: true },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[8px] text-white/40 font-bold tracking-wider">{s.label}</p>
                {s.isRaw || s.isPercent ? (
                  <p className="text-[10px] font-black" style={{ color: selected.colorHex }}>
                    {s.isPercent ? `${s.val}%` : s.val}
                  </p>
                ) : (
                  <div className="flex gap-0.5 justify-center mt-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full"
                        style={{ background: i < s.val ? selected.colorHex : "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Special + Super */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-center px-2 py-1 rounded-lg"
              style={{ background: `${selected.colorHex}33`, color: selected.colorHex }}>
              ✨ {selected.special}
            </div>
            {selected.superForm && (
              <div className="text-[10px] font-bold text-center px-2 py-1 rounded-lg"
                style={{ background: `${selected.superForm.colorHex}22`, color: selected.superForm.colorHex }}>
                ⚡ СУПЕР: {selected.superForm.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
