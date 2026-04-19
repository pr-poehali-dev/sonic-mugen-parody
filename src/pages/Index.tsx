import { useState } from "react";
import { Character, CHARACTERS } from "@/data/characters";
import CharacterSelect from "@/components/CharacterSelect";
import ArcadeMode from "@/components/ArcadeMode";
import FightArena from "@/components/FightArena";
import Icon from "@/components/ui/icon";

type Screen = "menu" | "select" | "arcade" | "freeplay";
type FreeplayStep = "pick" | "fight";

export default function Index() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playerChar, setPlayerChar] = useState<Character | null>(CHARACTERS[0]);
  const [enemyChar, setEnemyChar] = useState<Character | null>(CHARACTERS[1]);
  const [freeplayStep, setFreeplayStep] = useState<FreeplayStep>("pick");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4"
      style={{
        background: "linear-gradient(160deg, #0a0014 0%, #0d001a 40%, #050010 100%)",
        fontFamily: "'Oswald', sans-serif",
      }}
    >
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/10 animate-ping"
          style={{ width: 600, height: 600, animationDuration: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500/10 animate-ping"
          style={{ width: 900, height: 900, animationDuration: "7s" }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #3b82f6, transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #a78bfa, transparent)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* ─── MAIN MENU ─── */}
        {screen === "menu" && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div
                  className="w-7 h-7 rounded-full animate-pulse"
                  style={{ background: "radial-gradient(circle, #60a5fa, #3b82f6)" }}
                />
                <h1
                  className="text-4xl sm:text-5xl font-black tracking-tighter"
                  style={{
                    background: "linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  SONIC FIGHTERS
                </h1>
                <div
                  className="w-7 h-7 rounded-full animate-pulse"
                  style={{ background: "radial-gradient(circle, #f472b6, #ec4899)", animationDelay: "0.5s" }}
                />
              </div>
              <p className="text-white/40 text-sm font-bold tracking-widest uppercase">
                Speed · Power · Kombat
              </p>
            </div>

            {/* Roster preview */}
            <div className="flex gap-4 flex-wrap justify-center">
              {CHARACTERS.map((c) => (
                <div
                  key={c.id}
                  className="text-4xl hover:scale-125 transition-transform cursor-default"
                  style={{ filter: `drop-shadow(0 0 10px ${c.colorHex})` }}
                  title={c.name}
                >
                  {c.emoji}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => setScreen("select")}
                className="py-4 px-8 rounded-2xl font-black text-xl tracking-widest text-black transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                  boxShadow: "0 0 32px #3b82f655",
                }}
              >
                ⚡ АРКАДНЫЙ РЕЖИМ
              </button>

              <button
                onClick={() => { setFreeplayStep("pick"); setScreen("freeplay"); }}
                className="py-4 px-8 rounded-2xl font-black text-lg tracking-widest border-2 border-white/20 text-white hover:border-white/50 hover:bg-white/5 transition-all"
              >
                ⚔️ СВОБОДНЫЙ БОЙ
              </button>
            </div>

            <p className="text-white/20 text-xs font-bold tracking-widest text-center">
              {CHARACTERS.length} БОЙЦОВ · БЛОК · ПАРИРОВАНИЕ · КОМБО-АТАКИ
            </p>
          </div>
        )}

        {/* ─── SELECT FOR ARCADE ─── */}
        {screen === "select" && (
          <div className="flex flex-col gap-5">
            <button
              onClick={() => setScreen("menu")}
              className="self-start flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors"
            >
              <Icon name="ChevronLeft" size={14} fallback="Circle" />
              НАЗАД
            </button>
            <div className="text-center">
              <p className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-1">
                Аркадный режим
              </p>
              <p className="text-2xl font-black text-white">Выбери бойца</p>
              <p className="text-white/40 text-xs mt-1">7 боёв подряд против компьютера</p>
            </div>

            <CharacterSelect selected={playerChar} onSelect={setPlayerChar} label="Твой боец" />

            <button
              disabled={!playerChar}
              onClick={() => setScreen("arcade")}
              className="py-4 rounded-2xl font-black text-lg tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: playerChar
                  ? `linear-gradient(135deg, ${playerChar.colorHex}, ${playerChar.colorHex}88)`
                  : "#333",
                color: "#000",
                boxShadow: playerChar ? `0 0 24px ${playerChar.colorHex}55` : undefined,
              }}
            >
              ВПЕРЁД! →
            </button>
          </div>
        )}

        {/* ─── ARCADE MODE ─── */}
        {screen === "arcade" && playerChar && (
          <ArcadeMode player={playerChar} onBack={() => setScreen("menu")} />
        )}

        {/* ─── FREE PLAY ─── */}
        {screen === "freeplay" && (
          <div className="flex flex-col gap-5">
            {freeplayStep === "pick" && (
              <>
                <button
                  onClick={() => setScreen("menu")}
                  className="self-start flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors"
                >
                  <Icon name="ChevronLeft" size={14} fallback="Circle" />
                  НАЗАД
                </button>
                <p className="text-center text-xs font-black tracking-widest text-purple-400 uppercase">
                  Свободный бой
                </p>
                <CharacterSelect selected={playerChar} onSelect={setPlayerChar} label="Твой боец" />
                <div className="border-t border-white/10" />
                <CharacterSelect selected={enemyChar} onSelect={setEnemyChar} label="Противник" />
                <button
                  disabled={!playerChar || !enemyChar}
                  onClick={() => setFreeplayStep("fight")}
                  className="py-4 rounded-2xl font-black text-lg tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: playerChar
                      ? `linear-gradient(135deg, ${playerChar.colorHex}, ${playerChar.colorHex}88)`
                      : "#333",
                    color: "#000",
                    boxShadow: playerChar ? `0 0 24px ${playerChar.colorHex}55` : undefined,
                  }}
                >
                  ⚡ НАЧАТЬ БОЙ!
                </button>
              </>
            )}

            {freeplayStep === "fight" && playerChar && enemyChar && (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setFreeplayStep("pick")}
                    className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Icon name="ChevronLeft" size={14} fallback="Circle" />
                    СМЕНА БОЙЦОВ
                  </button>
                  <p className="text-xs font-black text-white/40 tracking-widest">СВОБОДНЫЙ БОЙ</p>
                  <button
                    onClick={() => setScreen("menu")}
                    className="text-white/30 hover:text-white text-xs font-bold transition-colors"
                  >
                    МЕНЮ
                  </button>
                </div>
                <FightArena
                  player={playerChar}
                  enemy={enemyChar}
                  onFightEnd={() => setFreeplayStep("pick")}
                />
              </>
            )}
          </div>
        )}
      </div>

      <link
        href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
