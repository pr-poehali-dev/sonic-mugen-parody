import { useState } from "react";
import { Character, CHARACTERS } from "@/data/characters";
import FightArena from "@/components/FightArena";
import Icon from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ArcadePhase = "intro" | "fighting" | "victory" | "gameover";

const ARCADE_SEQUENCE = ["shadow", "knuckles", "tails", "blaze", "silver", "rouge", "amy"];

interface Props {
  player: Character;
  onBack: () => void;
}

export default function ArcadeMode({ player, onBack }: Props) {
  const [phase, setPhase] = useState<ArcadePhase>("intro");
  const [currentRound, setCurrentRound] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [lastResult, setLastResult] = useState<"win" | "lose" | "draw" | null>(null);

  const currentEnemyId = ARCADE_SEQUENCE[currentRound % ARCADE_SEQUENCE.length];
  const currentEnemy = CHARACTERS.find((c) => c.id === currentEnemyId) || CHARACTERS[1];
  const totalRounds = ARCADE_SEQUENCE.length;
  const isLastRound = currentRound === totalRounds - 1;

  const handleFightEnd = (result: "win" | "lose" | "draw") => {
    setLastResult(result);
    if (result === "win" || result === "draw") {
      setWins((w) => w + 1);
      if (isLastRound) {
        setPhase("victory");
      } else {
        setPhase("intro");
        setCurrentRound((r) => r + 1);
      }
    } else {
      setLosses((l) => l + 1);
      setPhase("gameover");
    }
  };

  const restart = () => {
    setCurrentRound(0);
    setWins(0);
    setLosses(0);
    setLastResult(null);
    setPhase("intro");
  };

  if (phase === "gameover") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[400px]">
        <div className="text-center">
          <p className="text-6xl font-black text-red-400 tracking-widest mb-2">GAME OVER</p>
          <p className="text-white/60 text-sm">{player.name} проиграл {currentEnemy.name}</p>
          <p className="text-white/40 text-xs mt-1">
            Пройдено раундов: {currentRound} / {totalRounds} · Побед: {wins}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={restart}
            className="px-6 py-3 rounded-xl font-black text-sm border-2 border-yellow-400 text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 transition-all"
          >
            НАЧАТЬ СНОВА
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl font-black text-sm border-2 border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            ГЛАВНОЕ МЕНЮ
          </button>
        </div>
      </div>
    );
  }

  if (phase === "victory") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[400px]">
        <div className="text-center">
          <p className="text-5xl font-black text-yellow-400 tracking-widest mb-2">
            🏆 ПОБЕДИТЕЛЬ!
          </p>
          <p className="text-2xl font-black text-white mb-1">{player.name}</p>
          <p className="text-white/60 text-sm">
            Прошёл весь аркадный режим! Побед: {wins + 1} / {totalRounds}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={restart}
            className="px-6 py-3 rounded-xl font-black text-sm border-2 border-yellow-400 text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 transition-all"
          >
            ИГРАТЬ ЕЩЁ РАЗ
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl font-black text-sm border-2 border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            МЕНЮ
          </button>
        </div>
      </div>
    );
  }

  if (phase === "fighting") {
    return (
      <div className="flex flex-col gap-3">
        {/* Round header */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors"
          >
            <Icon name="ChevronLeft" size={14} fallback="Circle" />
            МЕНЮ
          </button>
          <div className="text-center">
            <p className="text-xs font-black text-white/60 tracking-widest">
              РАУНД {currentRound + 1} / {totalRounds}
            </p>
            <div className="flex gap-1 justify-center mt-1">
              {ARCADE_SEQUENCE.map((id, i) => (
                <div
                  key={id}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      i < currentRound
                        ? "#22c55e"
                        : i === currentRound
                        ? "#facc15"
                        : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-green-400">ПОБЕД: {wins}</p>
          </div>
        </div>

        {lastResult && currentRound > 0 && (
          <div
            className={cn(
              "text-center text-xs font-black py-1.5 rounded-lg",
              lastResult === "win" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"
            )}
          >
            {lastResult === "win" ? "✓ ПОБЕДА В ПРЕДЫДУЩЕМ РАУНДЕ" : "~ НИЧЬЯ"}
          </div>
        )}

        <FightArena player={player} enemy={currentEnemy} onFightEnd={handleFightEnd} />
      </div>
    );
  }

  // intro phase
  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1 text-white/40 hover:text-white text-xs font-bold transition-colors"
      >
        <Icon name="ChevronLeft" size={14} fallback="Circle" />
        НАЗАД
      </button>

      <div className="text-center">
        <p className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-1">
          АРКАДНЫЙ РЕЖИМ · РАУНД {currentRound + 1}/{totalRounds}
        </p>
        <p className="text-2xl font-black text-white">СЛЕДУЮЩИЙ ПРОТИВНИК</p>
      </div>

      {/* VS card */}
      <div className="flex items-center gap-6 w-full max-w-sm">
        <div
          className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10"
          style={{ background: `${player.colorHex}11` }}
        >
          <span className="text-5xl" style={{ filter: `drop-shadow(0 0 12px ${player.colorHex})` }}>
            {player.emoji}
          </span>
          <p className="font-black text-white text-sm">{player.name}</p>
          <p className="text-[10px]" style={{ color: player.colorHex }}>
            {player.style}
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-2xl font-black text-white/40">VS</p>
          <div className="flex gap-0.5">
            {ARCADE_SEQUENCE.map((id, i) => (
              <div
                key={id}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background:
                    i < currentRound
                      ? "#22c55e"
                      : i === currentRound
                      ? "#facc15"
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10"
          style={{ background: `${currentEnemy.colorHex}11` }}
        >
          <span
            className="text-5xl scale-x-[-1]"
            style={{ filter: `drop-shadow(0 0 12px ${currentEnemy.colorHex})` }}
          >
            {currentEnemy.emoji}
          </span>
          <p className="font-black text-white text-sm">{currentEnemy.name}</p>
          <p className="text-[10px]" style={{ color: currentEnemy.colorHex }}>
            {currentEnemy.style}
          </p>
        </div>
      </div>

      {/* Enemy stats */}
      <div
        className="w-full max-w-sm p-4 rounded-2xl border border-white/10"
        style={{ background: `${currentEnemy.colorHex}11` }}
      >
        <p className="text-xs font-black text-white/50 tracking-widest uppercase mb-3 text-center">
          Статы противника
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "СКОРОСТЬ", val: currentEnemy.speed },
            { label: "СИЛА", val: currentEnemy.power },
            { label: "ЗАЩИТА", val: currentEnemy.defense },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[9px] text-white/40 font-bold tracking-wider">{s.label}</p>
              <div className="flex gap-0.5 justify-center mt-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background:
                        i < s.val ? currentEnemy.colorHex : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-3 text-[10px] font-bold text-center px-2 py-1 rounded-lg"
          style={{ background: `${currentEnemy.colorHex}33`, color: currentEnemy.colorHex }}
        >
          ✨ {currentEnemy.special}
        </div>
      </div>

      <button
        onClick={() => setPhase("fighting")}
        className="w-full max-w-sm py-4 rounded-2xl font-black text-lg tracking-widest transition-all hover:scale-105 active:scale-95"
        style={{
          background: `linear-gradient(135deg, ${player.colorHex}, ${player.colorHex}99)`,
          color: "#000",
          boxShadow: `0 0 24px ${player.colorHex}66`,
        }}
      >
        ⚡ НАЧАТЬ БОЙ!
      </button>
    </div>
  );
}
