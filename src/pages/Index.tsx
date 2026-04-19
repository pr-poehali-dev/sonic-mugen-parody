import { useState } from "react";
import { Character, CHARACTERS, getUnlockedCharacters } from "@/data/characters";
import CharacterSelect from "@/components/CharacterSelect";
import ArcadeMode from "@/components/ArcadeMode";
import FightArena from "@/components/FightArena";
import Shop from "@/components/Shop";
import Icon from "@/components/ui/icon";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";

type Screen = "menu" | "select" | "arcade" | "freeplay" | "shop";
type FreeplayStep = "pick" | "fight";

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playerChar, setPlayerChar] = useState<Character | null>(CHARACTERS[0]);
  const [enemyChar, setEnemyChar] = useState<Character | null>(CHARACTERS[1]);
  const [freeplayStep, setFreeplayStep] = useState<FreeplayStep>("pick");
  const [ringNotif, setRingNotif] = useState<number | null>(null);

  const { store, addRings, isOwned } = useStore();
  const ownedChars = getUnlockedCharacters(store.ownedCharacterIds);

  const handleFightEnd = (result: "win" | "lose" | "draw", ringsEarned: number) => {
    addRings(ringsEarned);
    setRingNotif(ringsEarned);
    setTimeout(() => setRingNotif(null), 3000);
    setFreeplayStep("pick");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4"
      style={{
        background: "linear-gradient(160deg, #0a0014 0%, #0d001a 40%, #050010 100%)",
        fontFamily: "'Oswald', sans-serif",
      }}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/10 animate-ping"
          style={{ width: 600, height: 600, animationDuration: "4s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500/10 animate-ping"
          style={{ width: 900, height: 900, animationDuration: "7s" }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #3b82f6, transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #a78bfa, transparent)" }} />
      </div>

      {/* Ring notification */}
      {ringNotif !== null && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-black text-sm border border-yellow-400/40 bg-yellow-400/15 text-yellow-300 backdrop-blur-sm anim-combo-pop">
          +{ringNotif} 💍 КОЛЬЦА ПОЛУЧЕНЫ!
        </div>
      )}

      <div className="relative z-10 w-full max-w-lg">

        {/* ─── MAIN MENU ─── */}
        {screen === "menu" && (
          <div className="flex flex-col items-center gap-6">
            {/* Wallet */}
            <div className="flex items-center gap-4 self-end">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/20">
                <span>💍</span>
                <span className="font-black text-yellow-300 text-sm">{store.rings.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-400/10 border border-blue-400/20">
                <span>💎</span>
                <span className="font-black text-blue-300 text-sm">{store.gems}</span>
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full animate-pulse"
                  style={{ background: "radial-gradient(circle, #60a5fa, #3b82f6)" }} />
                <h1 className="text-4xl sm:text-5xl font-black tracking-tighter"
                  style={{ background: "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  SONIC FIGHTERS
                </h1>
                <div className="w-7 h-7 rounded-full animate-pulse"
                  style={{ background: "radial-gradient(circle, #f472b6, #ec4899)", animationDelay: "0.5s" }} />
              </div>
              <p className="text-white/40 text-sm font-bold tracking-widest uppercase">
                Speed · Power · Anime · Kombat
              </p>
            </div>

            {/* Roster preview */}
            <div className="flex gap-3 flex-wrap justify-center">
              {CHARACTERS.map(c => {
                const owned = isOwned(c.id);
                return (
                  <div key={c.id} className={cn("text-3xl transition-transform cursor-default relative", owned ? "hover:scale-125" : "grayscale opacity-40")}
                    style={{ filter: owned ? `drop-shadow(0 0 8px ${c.colorHex})` : undefined }}
                    title={owned ? c.name : `🔒 ${c.name}`}>
                    {c.emoji}
                    {!owned && <span className="absolute -top-1 -right-1 text-[8px]">🔒</span>}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button onClick={() => setScreen("select")}
                className="py-4 px-8 rounded-2xl font-black text-xl tracking-widest text-black transition-all hover:scale-105 active:scale-95"
                style={{ background: "linear-gradient(135deg, #60a5fa, #3b82f6)", boxShadow: "0 0 32px #3b82f644" }}>
                ⚡ АРКАДНЫЙ РЕЖИМ
              </button>
              <button onClick={() => { setFreeplayStep("pick"); setScreen("freeplay"); }}
                className="py-3.5 px-8 rounded-2xl font-black text-lg tracking-widest border-2 border-white/20 text-white hover:border-white/50 hover:bg-white/5 transition-all">
                ⚔️ СВОБОДНЫЙ БОЙ
              </button>
              <button onClick={() => setScreen("shop")}
                className="py-3.5 px-8 rounded-2xl font-black text-lg tracking-widest border-2 border-yellow-400/30 text-yellow-300 hover:border-yellow-400/60 hover:bg-yellow-400/5 transition-all">
                🛍️ МАГАЗИН · СУНДУКИ
              </button>
            </div>

            <div className="flex gap-4 text-center">
              <div className="flex flex-col gap-0.5">
                <p className="text-xl font-black text-white">{CHARACTERS.length}</p>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Бойцов</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex flex-col gap-0.5">
                <p className="text-xl font-black text-white">{ownedChars.length}</p>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Куплено</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex flex-col gap-0.5">
                <p className="text-xl font-black text-white">4</p>
                <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Сундука</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── SHOP ─── */}
        {screen === "shop" && (
          <Shop onBack={() => setScreen("menu")} />
        )}

        {/* ─── SELECT FOR ARCADE ─── */}
        {screen === "select" && (
          <div className="flex flex-col gap-5">
            <button onClick={() => setScreen("menu")}
              className="self-start flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors">
              <Icon name="ChevronLeft" size={14} fallback="Circle" />
              НАЗАД
            </button>
            <div className="text-center">
              <p className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-1">Аркадный режим</p>
              <p className="text-2xl font-black text-white">Выбери бойца</p>
              <p className="text-white/40 text-xs mt-1">
                {ownedChars.length} бойцов доступно · 7 боёв подряд
              </p>
            </div>
            <CharacterSelect
              selected={playerChar}
              onSelect={setPlayerChar}
              label="Твой боец"
              availableChars={ownedChars}
            />
            <button
              disabled={!playerChar}
              onClick={() => setScreen("arcade")}
              className="py-4 rounded-2xl font-black text-lg tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: playerChar ? `linear-gradient(135deg, ${playerChar.colorHex}, ${playerChar.colorHex}88)` : "#333",
                color: "#000",
                boxShadow: playerChar ? `0 0 24px ${playerChar.colorHex}55` : undefined,
              }}>
              ВПЕРЁД! →
            </button>
          </div>
        )}

        {/* ─── ARCADE ─── */}
        {screen === "arcade" && playerChar && (
          <ArcadeMode player={playerChar} onBack={() => setScreen("menu")} onRingsEarned={addRings} />
        )}

        {/* ─── FREEPLAY ─── */}
        {screen === "freeplay" && (
          <div className="flex flex-col gap-4">
            {freeplayStep === "pick" && (
              <>
                <button onClick={() => setScreen("menu")}
                  className="self-start flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors">
                  <Icon name="ChevronLeft" size={14} fallback="Circle" />
                  НАЗАД
                </button>
                <p className="text-center text-xs font-black tracking-widest text-purple-400 uppercase">Свободный бой</p>
                <CharacterSelect
                  selected={playerChar}
                  onSelect={setPlayerChar}
                  label="Твой боец"
                  availableChars={ownedChars}
                />
                <div className="border-t border-white/10" />
                <CharacterSelect
                  selected={enemyChar}
                  onSelect={setEnemyChar}
                  label="Противник"
                  availableChars={CHARACTERS}
                />
                <button
                  disabled={!playerChar || !enemyChar}
                  onClick={() => setFreeplayStep("fight")}
                  className="py-4 rounded-2xl font-black text-lg tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: playerChar ? `linear-gradient(135deg, ${playerChar.colorHex}, ${playerChar.colorHex}88)` : "#333",
                    color: "#000",
                    boxShadow: playerChar ? `0 0 24px ${playerChar.colorHex}55` : undefined,
                  }}>
                  ⚡ НАЧАТЬ БОЙ!
                </button>
              </>
            )}
            {freeplayStep === "fight" && playerChar && enemyChar && (
              <>
                <div className="flex items-center justify-between">
                  <button onClick={() => setFreeplayStep("pick")}
                    className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors">
                    <Icon name="ChevronLeft" size={14} fallback="Circle" />
                    ВЫБРАТЬ
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-yellow-300">💍 {store.rings.toLocaleString()}</span>
                    <button onClick={() => setScreen("menu")} className="text-white/30 hover:text-white text-xs font-bold transition-colors">МЕНЮ</button>
                  </div>
                </div>
                <FightArena player={playerChar} enemy={enemyChar} onFightEnd={handleFightEnd} />
              </>
            )}
          </div>
        )}
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}
