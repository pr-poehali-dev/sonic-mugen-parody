import { useState } from "react";
import { CHARACTERS, RARITY_CONFIG, Character } from "@/data/characters";
import { CHESTS, ChestType, useStore } from "@/hooks/useStore";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ShopTab = "characters" | "chests";

interface Props {
  onBack: () => void;
}

function RarityBadge({ rarity }: { rarity: Character["rarity"] }) {
  const cfg = RARITY_CONFIG[rarity];
  return (
    <span
      className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider"
      style={{ background: cfg.glow, color: cfg.color, border: `1px solid ${cfg.color}44` }}
    >
      {cfg.star} {cfg.label}
    </span>
  );
}

function ChestResultModal({ characterId, isNew, onClose }: { characterId: string; isNew: boolean; onClose: () => void }) {
  const char = CHARACTERS.find(c => c.id === characterId);
  if (!char) return null;
  const cfg = RARITY_CONFIG[char.rarity];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="relative flex flex-col items-center gap-4 p-8 rounded-3xl border-2 max-w-xs w-full mx-4 text-center"
        style={{ borderColor: cfg.color, background: `linear-gradient(135deg, ${cfg.glow}, #0a0014)`, boxShadow: `0 0 40px ${cfg.color}55` }}
      >
        <p className="text-xs font-black tracking-widest text-white/50 uppercase">
          {isNew ? "НОВЫЙ БОЕЦ!" : "ДУБЛИКАТ — +150 💍"}
        </p>
        <div
          className="text-8xl"
          style={{ filter: `drop-shadow(0 0 24px ${cfg.color})`, animation: "super-pulse 1s ease-in-out infinite", "--super-glow": cfg.color } as React.CSSProperties}
        >
          {char.emoji}
        </div>
        <div>
          <p className="text-2xl font-black text-white">{char.name}</p>
          <p className="text-sm mt-1" style={{ color: cfg.color }}>{char.description}</p>
          <div className="mt-2 flex justify-center">
            <RarityBadge rarity={char.rarity} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-black text-black transition-all hover:scale-105 active:scale-95"
          style={{ background: cfg.color }}
        >
          ЗАБРАТЬ!
        </button>
      </div>
    </div>
  );
}

export default function Shop({ onBack }: Props) {
  const { store, buyCharacter, openChest, clearChestResult, isOwned } = useStore();
  const [tab, setTab] = useState<ShopTab>("characters");
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [openingChest, setOpeningChest] = useState<ChestType | null>(null);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  };

  const handleBuy = (charId: string) => {
    const r = buyCharacter(charId);
    if (r === "ok") showMsg("✅ Персонаж куплен!");
    else if (r === "already") showMsg("Уже куплен!");
    else if (r === "no_rings") showMsg("Недостаточно колец 💍");
    else if (r === "no_gems") showMsg("Недостаточно кристаллов 💎");
  };

  const handleChest = (chestId: ChestType) => {
    setOpeningChest(chestId);
    setTimeout(() => {
      const r = openChest(chestId);
      setOpeningChest(null);
      if (r === "no_rings") showMsg("Недостаточно колец 💍");
      else if (r === "no_gems") showMsg("Недостаточно кристаллов 💎");
    }, 800);
  };

  const rarities = ["all", "common", "rare", "epic", "legendary", "mythic"];
  const filteredChars = CHARACTERS.filter(c => filter === "all" || c.rarity === filter);

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors"
        >
          <Icon name="ChevronLeft" size={14} fallback="Circle" />
          НАЗАД
        </button>
        <h2 className="text-xl font-black text-white tracking-widest">МАГАЗИН</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm">💍</span>
            <span className="text-sm font-black text-yellow-300">{store.rings.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">💎</span>
            <span className="text-sm font-black text-blue-300">{store.gems}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className="text-center text-sm font-black py-2 px-4 rounded-xl bg-white/10 text-white border border-white/20 transition-all">
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
        {[
          { id: "characters" as ShopTab, label: "Персонажи", icon: "Users" },
          { id: "chests" as ShopTab, label: "Сундуки", icon: "Package" },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-black text-sm transition-all",
              tab === t.id ? "bg-white/15 text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            <Icon name={t.icon} size={14} fallback="Circle" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Characters Tab */}
      {tab === "characters" && (
        <div className="flex flex-col gap-3">
          {/* Rarity filter */}
          <div className="flex gap-1 flex-wrap">
            {rarities.map(r => {
              const cfg = r !== "all" ? RARITY_CONFIG[r as Character["rarity"]] : null;
              return (
                <button
                  key={r}
                  onClick={() => setFilter(r)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                    filter === r ? "border-white/40 bg-white/15 text-white" : "border-white/10 text-white/40 hover:text-white/60"
                  )}
                  style={filter === r && cfg ? { borderColor: cfg.color, color: cfg.color } : {}}
                >
                  {r === "all" ? "ВСЕ" : (cfg?.star + " " + cfg?.label)}
                </button>
              );
            })}
          </div>

          {/* Character list */}
          <div className="flex flex-col gap-2">
            {filteredChars.map(char => {
              const owned = isOwned(char.id);
              const cfg = RARITY_CONFIG[char.rarity];
              return (
                <div
                  key={char.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border transition-all"
                  style={{
                    borderColor: owned ? `${cfg.color}55` : "rgba(255,255,255,0.08)",
                    background: `linear-gradient(135deg, ${cfg.glow} 0%, rgba(255,255,255,0.03) 100%)`,
                  }}
                >
                  <div
                    className="text-4xl shrink-0"
                    style={{ filter: `drop-shadow(0 0 10px ${char.colorHex})` }}
                  >
                    {char.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-black text-white text-sm">{char.name}</p>
                      <RarityBadge rarity={char.rarity} />
                    </div>
                    <p className="text-[10px] text-white/40">{char.origin} · {char.style}</p>
                    <div className="flex gap-3 mt-1">
                      {[
                        { l: "СИЛ", v: char.power },
                        { l: "СКО", v: char.speed },
                        { l: "ЗАЩ", v: char.defense },
                        { l: "КРИ", v: char.critChance },
                      ].map(s => (
                        <div key={s.l} className="text-center">
                          <p className="text-[8px] text-white/30 font-bold">{s.l}</p>
                          <p className="text-[10px] font-black" style={{ color: char.colorHex }}>
                            {s.l === "КРИ" ? `${s.v}%` : s.v}
                          </p>
                        </div>
                      ))}
                      <div className="text-center">
                        <p className="text-[8px] text-white/30 font-bold">HP</p>
                        <p className="text-[10px] font-black" style={{ color: char.colorHex }}>{char.maxHP}</p>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {owned ? (
                      <span className="text-[10px] font-black text-green-400 px-2 py-1 bg-green-400/10 rounded-lg border border-green-400/30">
                        ✓ КУПЛЕН
                      </span>
                    ) : char.price === 0 && char.priceGems === 0 ? (
                      <span className="text-[10px] font-black text-white/30">БЕСПЛАТНО</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {char.price > 0 && (
                          <button
                            onClick={() => handleBuy(char.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all hover:scale-105 active:scale-95 text-black"
                            style={{ background: cfg.color }}
                          >
                            💍 {char.price.toLocaleString()}
                          </button>
                        )}
                        {char.priceGems > 0 && (
                          <button
                            onClick={() => handleBuy(char.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                          >
                            💎 {char.priceGems}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chests Tab */}
      {tab === "chests" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/40 text-center font-bold">
            Открывай сундуки — получай случайных бойцов. Дубликат = 💍150 колец
          </p>
          {CHESTS.map(chest => (
            <div
              key={chest.id}
              className="p-4 rounded-2xl border transition-all"
              style={{
                borderColor: `${chest.color}44`,
                background: `linear-gradient(135deg, ${chest.glow}, rgba(255,255,255,0.02))`,
                boxShadow: openingChest === chest.id ? `0 0 30px ${chest.color}44` : undefined,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn("text-5xl", openingChest === chest.id && "animate-pulse")}
                  style={{ filter: `drop-shadow(0 0 12px ${chest.color})` }}
                >
                  {chest.emoji}
                </div>
                <div className="flex-1">
                  <p className="font-black text-white">{chest.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{chest.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  {chest.priceGems > 0 ? (
                    <button
                      onClick={() => handleChest(chest.id)}
                      disabled={!!openingChest}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl font-black text-sm text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ background: chest.color }}
                    >
                      💎 {chest.priceGems}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleChest(chest.id)}
                      disabled={!!openingChest}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl font-black text-sm text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ background: chest.color }}
                    >
                      💍 {chest.priceRings.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>

              {/* Rarity chances */}
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(chest.rarityWeights)
                  .filter(([, w]) => w > 0)
                  .map(([rarity, weight]) => {
                    const cfg = RARITY_CONFIG[rarity as Character["rarity"]];
                    const total = Object.values(chest.rarityWeights).reduce((a, b) => a + b, 0);
                    const pct = Math.round((weight / total) * 100);
                    return (
                      <div
                        key={rarity}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
                        style={{ background: cfg.glow, border: `1px solid ${cfg.color}33` }}
                      >
                        <span className="text-[9px]">{cfg.star}</span>
                        <span className="text-[9px] font-black" style={{ color: cfg.color }}>{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Info */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-white/40 font-bold text-center">
              💡 Кольца зарабатываются за победы в боях · Кристаллы — редкая валюта
            </p>
          </div>
        </div>
      )}

      {/* Chest result */}
      {store.lastChestResult && (
        <ChestResultModal
          characterId={store.lastChestResult.characterId}
          isNew={store.lastChestResult.isNew}
          onClose={clearChestResult}
        />
      )}
    </div>
  );
}
