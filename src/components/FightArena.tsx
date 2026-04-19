import { useEffect } from "react";
import { Character } from "@/data/characters";
import { useFightEngine, ActionType } from "@/hooks/useFightEngine";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

interface Props {
  player: Character;
  enemy: Character;
  onFightEnd: (result: "win" | "lose" | "draw") => void;
}

function HPBar({
  current,
  max,
  color,
  reversed,
}: {
  current: number;
  max: number;
  color: string;
  reversed?: boolean;
}) {
  const pct = Math.max(0, (current / max) * 100);
  const dangerColor = pct < 30 ? "#ef4444" : pct < 60 ? "#f59e0b" : color;
  return (
    <div className={cn("flex-1 flex flex-col gap-1", reversed && "items-end")}>
      <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden border border-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${dangerColor}cc, ${dangerColor})`,
            boxShadow: `0 0 8px ${dangerColor}88`,
            float: reversed ? "right" : "left",
          }}
        />
      </div>
      <p className="text-xs font-black" style={{ color: dangerColor }}>
        {current}/{max}
      </p>
    </div>
  );
}

function EnergyBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
        }}
      />
    </div>
  );
}

const ACTIONS: { key: ActionType; label: string; icon: string; cost: number; desc: string }[] = [
  { key: "attack", label: "Удар", icon: "Swords", cost: 0, desc: "Быстрая атака" },
  { key: "heavy", label: "Сильный", icon: "Zap", cost: 20, desc: "Пробивает блок" },
  { key: "block", label: "Блок", icon: "Shield", cost: 0, desc: "Снижает урон" },
  { key: "parry", label: "Парир.", icon: "RotateCcw", cost: 0, desc: "Контратака при успехе" },
  { key: "special", label: "СПЕЦ", icon: "Star", cost: 40, desc: "Мощнейший приём" },
  { key: "dodge", label: "Уклон", icon: "Wind", cost: 0, desc: "+15 энергии" },
];

export default function FightArena({ player, enemy, onFightEnd }: Props) {
  const { state, startFight, playerAction, restoreEnergy } = useFightEngine(player, enemy);

  useEffect(() => {
    startFight();
  }, []);

  useEffect(() => {
    if (state.phase === "player_win" || state.phase === "enemy_win" || state.phase === "draw") {
      const result =
        state.phase === "player_win" ? "win" : state.phase === "enemy_win" ? "lose" : "draw";
      setTimeout(() => onFightEnd(result), 2000);
    }
  }, [state.phase, onFightEnd]);

  useEffect(() => {
    if (state.phase !== "fighting") return;
    const interval = setInterval(restoreEnergy, 2000);
    return () => clearInterval(interval);
  }, [state.phase, restoreEnergy]);

  const isOver = state.phase !== "fighting" && state.phase !== "idle";

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* HP bars */}
      <div className="flex items-start gap-3 px-2">
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{player.emoji}</span>
            <span className="font-black text-white text-sm">{player.name}</span>
            {state.combo > 1 && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse"
                style={{ background: player.colorHex, color: "#000" }}
              >
                КОМБО ×{state.combo}
              </span>
            )}
          </div>
          <HPBar current={state.playerHP} max={state.playerMaxHP} color={player.colorHex} />
          <EnergyBar value={state.playerEnergy} color={player.colorHex} />
          <p className="text-[9px] text-white/40 font-bold">ЭНЕРГИЯ {state.playerEnergy}/100</p>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <p className="text-xs font-black text-white/40">VS</p>
          <p className="text-[10px] font-bold text-white/30">РД {state.roundNumber}</p>
        </div>

        <div className="flex flex-col gap-1 flex-1 items-end">
          <div className="flex items-center gap-2 mb-0.5 flex-row-reverse">
            <span className="text-lg">{enemy.emoji}</span>
            <span className="font-black text-white text-sm">{enemy.name}</span>
          </div>
          <HPBar current={state.enemyHP} max={state.enemyMaxHP} color={enemy.colorHex} reversed />
          <EnergyBar value={state.enemyEnergy} color={enemy.colorHex} />
          <p className="text-[9px] text-white/40 font-bold">ЭНЕРГИЯ {state.enemyEnergy}/100</p>
        </div>
      </div>

      {/* Fighter display */}
      <div
        className={cn(
          "relative flex justify-between items-end px-6 py-4 rounded-2xl border border-white/10 overflow-hidden min-h-[120px]",
          state.shake === "enemy" && "animate-pulse",
        )}
        style={{
          background: `linear-gradient(135deg, ${player.colorHex}11 0%, #0a0a1a 50%, ${enemy.colorHex}11 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />

        {/* Player fighter */}
        <div
          className={cn(
            "relative z-10 flex flex-col items-center transition-transform duration-200",
            state.shake === "player" && "translate-x-2",
            state.isBlocking && "opacity-80",
            state.isParrying && "opacity-90"
          )}
        >
          <div
            className={cn(
              "text-6xl transition-all duration-200",
              state.flashPlayer && "opacity-30",
              state.isBlocking && "scale-90",
              state.isParrying && "scale-110"
            )}
            style={{
              filter: state.flashPlayer
                ? `drop-shadow(0 0 20px #ff0000)`
                : `drop-shadow(0 0 12px ${player.colorHex})`,
            }}
          >
            {player.emoji}
          </div>
          <div className="flex gap-1 mt-1">
            {state.isBlocking && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: "#3b82f6", color: "#fff" }}>
                БЛОК
              </span>
            )}
            {state.isParrying && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: "#8b5cf6", color: "#fff" }}>
                ПАРИР
              </span>
            )}
          </div>
        </div>

        {/* Battle flash effect */}
        {(state.flashPlayer || state.flashEnemy) && (
          <div className="absolute inset-0 pointer-events-none animate-ping opacity-10 bg-white rounded-2xl" />
        )}

        {/* Enemy fighter */}
        <div
          className={cn(
            "relative z-10 flex flex-col items-center transition-transform duration-200",
            state.shake === "enemy" && "-translate-x-2"
          )}
        >
          <div
            className={cn(
              "text-6xl scale-x-[-1] transition-all duration-200",
              state.flashEnemy && "opacity-30"
            )}
            style={{
              filter: state.flashEnemy
                ? `drop-shadow(0 0 20px #ff0000)`
                : `drop-shadow(0 0 12px ${enemy.colorHex})`,
            }}
          >
            {enemy.emoji}
          </div>
        </div>

        {/* Result overlay */}
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70 rounded-2xl">
            <div className="text-center">
              {state.phase === "player_win" && (
                <>
                  <p className="text-4xl font-black text-yellow-400 tracking-widest">ПОБЕДА!</p>
                  <p className="text-sm text-white/60 mt-1">{player.name} одержал победу!</p>
                </>
              )}
              {state.phase === "enemy_win" && (
                <>
                  <p className="text-4xl font-black text-red-400 tracking-widest">ПОРАЖЕНИЕ</p>
                  <p className="text-sm text-white/60 mt-1">{enemy.name} победил...</p>
                </>
              )}
              {state.phase === "draw" && (
                <>
                  <p className="text-4xl font-black text-slate-300 tracking-widest">НИЧЬЯ</p>
                  <p className="text-sm text-white/60 mt-1">Оба пали в бою!</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Battle log */}
      <div className="rounded-xl border border-white/10 bg-black/40 p-3 min-h-[80px]">
        {state.log.length === 0 ? (
          <p className="text-white/30 text-xs text-center italic">Выбери действие для начала боя...</p>
        ) : (
          <div className="flex flex-col gap-1">
            {state.log.map((entry, i) => (
              <p
                key={entry.id}
                className={cn(
                  "text-xs font-medium transition-all",
                  i === 0 ? "opacity-100" : i === 1 ? "opacity-60" : "opacity-30",
                  entry.type === "special" && "font-black text-yellow-300",
                  entry.type === "player" && "text-white",
                  entry.type === "enemy" && "text-red-300",
                  entry.type === "system" && "text-slate-400 italic"
                )}
              >
                {entry.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action) => {
          const isDisabled =
            isOver ||
            (action.cost > 0 && state.playerEnergy < action.cost) ||
            state.phase !== "fighting";
          const isSpecial = action.key === "special";
          return (
            <button
              key={action.key}
              disabled={isDisabled}
              onClick={() => playerAction(action.key)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150 active:scale-95",
                isSpecial
                  ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20 hover:border-yellow-400"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/30",
                isDisabled && "opacity-30 cursor-not-allowed hover:scale-100 hover:bg-transparent"
              )}
            >
              <Icon name={action.icon} size={18} className={isSpecial ? "text-yellow-400" : "text-white/60"} fallback="Circle" />
              <span className="text-xs font-black">{action.label}</span>
              {action.cost > 0 && (
                <span className="text-[9px] text-white/40">-{action.cost} ENG</span>
              )}
              <span className="text-[9px] text-white/30">{action.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}