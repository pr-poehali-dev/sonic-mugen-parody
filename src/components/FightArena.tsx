import { useEffect, useRef } from "react";
import { Character } from "@/data/characters";
import { useFightEngine, ActionType, CharAnim } from "@/hooks/useFightEngine";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

interface Props {
  player: Character;
  enemy: Character;
  onFightEnd: (result: "win" | "lose" | "draw") => void;
}

const IDLE_ANIMS: Record<string, string> = {
  sonic: "anim-idle-fast",
  shadow: "anim-idle-fast",
  knuckles: "anim-idle-heavy",
  tails: "anim-idle-float",
  amy: "anim-idle",
  silver: "anim-idle-float",
  blaze: "anim-idle-fast",
  rouge: "anim-idle-float",
};

function getIdleClass(charId: string, isSuper: boolean) {
  return isSuper ? "anim-super" : (IDLE_ANIMS[charId] || "anim-idle");
}

function getAnimClass(anim: CharAnim, charId: string, isSuper: boolean): string {
  if (anim === "idle" || anim === "super-idle") return getIdleClass(charId, isSuper);
  const map: Record<CharAnim, string> = {
    "idle": getIdleClass(charId, isSuper),
    "super-idle": "anim-super",
    "attack": charId === "sonic" || charId === "blaze" ? "anim-attack-spin" : "anim-attack",
    "heavy": "anim-attack-heavy",
    "hit": "anim-hit",
    "block": "anim-block",
    "parry": "anim-parry",
    "dodge": "anim-dodge",
    "special": "anim-attack-spin",
    "transform": "anim-transform",
  };
  return map[anim] || "anim-idle";
}

function HPBar({ current, max, color, reversed }: { current: number; max: number; color: string; reversed?: boolean }) {
  const pct = Math.max(0, (current / max) * 100);
  const danger = pct < 25 ? "#ef4444" : pct < 50 ? "#f59e0b" : color;
  return (
    <div className={cn("flex-1 flex flex-col gap-1", reversed && "items-end")}>
      <div className="w-full h-5 bg-black/60 rounded-full overflow-hidden border border-white/10 relative">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${danger}bb, ${danger})`,
            boxShadow: `0 0 10px ${danger}88`,
            float: reversed ? "right" : "left",
          }}
        />
        {pct < 25 && (
          <div className="absolute inset-0 rounded-full animate-pulse opacity-30"
            style={{ background: danger }} />
        )}
      </div>
      <p className="text-xs font-black tabular-nums" style={{ color: danger }}>
        {current}/{max}
      </p>
    </div>
  );
}

function EnergyBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] font-bold text-white/30 tracking-widest uppercase">{label}</p>
      <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 6px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

function SuperEnergyBar({ value, color }: { value: number; color: string }) {
  const full = value >= 100;
  return (
    <div className={cn("flex flex-col gap-0.5", full && "")}>
      <p className={cn("text-[9px] font-black tracking-widest uppercase", full ? "text-yellow-400 animate-pulse" : "text-white/30")}>
        {full ? "⚡ SUPER READY!" : `SUPER ${value}%`}
      </p>
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div
          className={cn("h-full rounded-full transition-all duration-500", full && "animate-pulse")}
          style={{
            width: `${value}%`,
            background: full
              ? `linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)`
              : `linear-gradient(90deg, ${color}66, ${color}aa)`,
            boxShadow: full ? `0 0 12px #fbbf2488` : "none",
          }}
        />
      </div>
    </div>
  );
}

const ACTIONS: { key: ActionType; label: string; icon: string; cost: number; desc: string; color?: string }[] = [
  { key: "attack", label: "Удар", icon: "Swords", cost: 0, desc: "Быстрая атака" },
  { key: "heavy", label: "Сильный", icon: "Zap", cost: 20, desc: "Пробивает блок" },
  { key: "block", label: "Блок", icon: "Shield", cost: 0, desc: "Снижает урон" },
  { key: "parry", label: "Парир.", icon: "RotateCcw", cost: 0, desc: "Контратака" },
  { key: "special", label: "СПЕЦ", icon: "Star", cost: 40, desc: "Мощнейший", color: "#fbbf24" },
  { key: "dodge", label: "Уклон", icon: "Wind", cost: 0, desc: "+18 ENG" },
  { key: "transform", label: "СУПЕР!", icon: "Flame", cost: 0, desc: "100 SUPER", color: "#f97316" },
];

export default function FightArena({ player, enemy, onFightEnd }: Props) {
  const { state, startFight, playerAction, restoreEnergy, dismissTransform } = useFightEngine(player, enemy);
  const { play } = useSound();
  const arenaRef = useRef<HTMLDivElement>(null);
  const prevPhase = useRef(state.phase);

  useEffect(() => { startFight(); }, []);

  useEffect(() => {
    if (state.phase === prevPhase.current) return;
    prevPhase.current = state.phase;
    if (state.phase === "player_win") {
      play("win");
      setTimeout(() => onFightEnd("win"), 2200);
    } else if (state.phase === "enemy_win") {
      play("lose");
      setTimeout(() => onFightEnd("lose"), 2200);
    } else if (state.phase === "draw") {
      setTimeout(() => onFightEnd("draw"), 2200);
    }
  }, [state.phase, onFightEnd, play]);

  useEffect(() => {
    if (state.phase !== "fighting") return;
    const interval = setInterval(restoreEnergy, 2200);
    return () => clearInterval(interval);
  }, [state.phase, restoreEnergy]);

  useEffect(() => {
    if (state.transformCutscene) {
      play("transform");
      const t = setTimeout(dismissTransform, 2000);
      return () => clearTimeout(t);
    }
  }, [state.transformCutscene, play, dismissTransform]);

  const handleAction = (action: ActionType) => {
    if (state.phase !== "fighting") return;
    switch (action) {
      case "attack": play("punch"); break;
      case "heavy": play("heavy"); break;
      case "block": play("block"); break;
      case "parry": play("parry"); break;
      case "special": play("special"); break;
      case "dodge": play("dodge"); break;
      case "transform": play("transform"); break;
    }
    playerAction(action);
  };

  const isOver = state.phase !== "fighting" && state.phase !== "idle";
  const playerSuperColor = player.superForm?.colorHex || player.colorHex;
  const enemySuperColor = enemy.superForm?.colorHex || enemy.colorHex;
  const playerDisplayColor = state.playerSuper ? playerSuperColor : player.colorHex;
  const enemyDisplayColor = state.enemySuper ? enemySuperColor : enemy.colorHex;

  return (
    <div className={cn("flex flex-col gap-3 w-full max-w-2xl mx-auto relative", state.shakeScreen && "shake")}>

      {/* ── Transform cutscene overlay ── */}
      {state.transformCutscene && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ animation: "transform-flash 2s ease forwards" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: state.transformSide === "player"
                ? `radial-gradient(circle, ${playerSuperColor}cc 0%, transparent 70%)`
                : `radial-gradient(circle, ${enemySuperColor}cc 0%, transparent 70%)`,
            }}
          />
          <div
            className="relative z-10 text-center px-8 py-6 rounded-2xl"
            style={{ animation: "transform-text 2s ease forwards" }}
          >
            <p className="text-6xl mb-2">
              {state.transformSide === "player" ? player.superForm?.emoji : enemy.superForm?.emoji}
            </p>
            <p
              className="text-3xl font-black tracking-widest"
              style={{ color: state.transformSide === "player" ? playerSuperColor : enemySuperColor }}
            >
              {state.transformSide === "player" ? player.superForm?.name : enemy.superForm?.name}
            </p>
          </div>
        </div>
      )}

      {/* ── HP bars ── */}
      <div className="flex items-start gap-3 px-1">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xl">{state.playerSuper ? player.superForm?.emoji : player.emoji}</span>
            <span className="font-black text-white text-sm truncate">{state.playerSuper ? player.superForm?.name : player.name}</span>
            {state.combo > 1 && (
              <span
                key={state.combo}
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full anim-combo-pop shrink-0"
                style={{ background: playerDisplayColor, color: "#000" }}
              >
                ×{state.combo}
              </span>
            )}
          </div>
          <HPBar current={state.playerHP} max={state.playerMaxHP} color={playerDisplayColor} />
          <EnergyBar value={state.playerEnergy} color={playerDisplayColor} label={`ENG ${state.playerEnergy}`} />
          {player.superForm && (
            <SuperEnergyBar value={state.playerSuperEnergy} color={playerDisplayColor} />
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5 shrink-0 px-1">
          <p className="text-xs font-black text-white/30">VS</p>
          <p className="text-[9px] text-white/20 font-bold">РД {state.roundNumber}</p>
        </div>

        <div className="flex flex-col gap-1 flex-1 items-end min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-row-reverse">
            <span className="text-xl">{state.enemySuper ? enemy.superForm?.emoji : enemy.emoji}</span>
            <span className="font-black text-white text-sm truncate">{state.enemySuper ? enemy.superForm?.name : enemy.name}</span>
          </div>
          <HPBar current={state.enemyHP} max={state.enemyMaxHP} color={enemyDisplayColor} reversed />
          <EnergyBar value={state.enemyEnergy} color={enemyDisplayColor} label={`ENG ${state.enemyEnergy}`} />
          {enemy.superForm && (
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-400 transition-all duration-300"
                style={{ width: `${state.enemyEnergy}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Arena ── */}
      <div
        ref={arenaRef}
        className="relative flex justify-between items-end px-8 py-6 rounded-2xl border border-white/10 overflow-hidden min-h-[160px]"
        style={{
          background: `linear-gradient(135deg, ${playerDisplayColor}18 0%, #050010 50%, ${enemyDisplayColor}18 100%)`,
        }}
      >
        {/* Background glow for super forms */}
        {state.playerSuper && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1/2 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 20% 50%, ${playerSuperColor}22 0%, transparent 70%)`,
              animation: "super-bg-pulse 1.2s ease-in-out infinite",
            }}
          />
        )}
        {state.enemySuper && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 80% 50%, ${enemySuperColor}22 0%, transparent 70%)`,
              animation: "super-bg-pulse 1.2s ease-in-out infinite",
            }}
          />
        )}

        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
          }}
        />

        {/* Hit flash overlays */}
        {state.hitFlashPlayer && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1/2 rounded-l-2xl pointer-events-none z-10"
            style={{ background: "rgba(255,50,50,0.35)", animation: "hit-flash 0.35s ease forwards" }}
          />
        )}
        {state.hitFlashEnemy && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 rounded-r-2xl pointer-events-none z-10"
            style={{ background: "rgba(255,50,50,0.35)", animation: "hit-flash 0.35s ease forwards" }}
          />
        )}

        {/* Particles */}
        {state.particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none z-20"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              "--px": `${p.px}px`,
              "--py": `${p.py}px`,
              animation: "particle-fly 0.7s ease-out forwards",
            } as React.CSSProperties}
          >
            {p.shape === "ring" ? (
              <div
                style={{
                  width: p.size * 2,
                  height: p.size * 2,
                  borderRadius: "50%",
                  border: `2px solid ${p.color}`,
                  animation: "particle-ring 0.5s ease-out forwards",
                }}
              />
            ) : p.shape === "star" ? (
              <div style={{ color: p.color, fontSize: p.size * 2, lineHeight: 1 }}>★</div>
            ) : (
              <div
                style={{
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                }}
              />
            )}
          </div>
        ))}

        {/* Player character */}
        <div className="relative z-10 flex flex-col items-center">
          {state.playerSuper && (
            <div
              className="absolute -inset-4 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${playerSuperColor}44 0%, transparent 70%)`,
                animation: "super-ring 1.5s ease-in-out infinite",
                "--super-glow": playerSuperColor,
              } as React.CSSProperties}
            />
          )}
          <div
            key={`${state.playerAnim}-${state.playerHP}`}
            className={cn(
              "text-7xl select-none cursor-default transition-filter duration-100",
              getAnimClass(state.playerAnim, player.id, state.playerSuper)
            )}
            style={{
              filter: state.playerSuper
                ? `drop-shadow(0 0 20px ${playerSuperColor}) brightness(1.3)`
                : `drop-shadow(0 0 10px ${player.colorHex})`,
              "--super-glow": playerSuperColor,
            } as React.CSSProperties}
          >
            {state.playerSuper ? player.superForm?.emoji : player.emoji}
          </div>
          <div className="flex gap-1 mt-1 h-5 items-center">
            {state.isBlocking && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500 text-white">БЛОК</span>
            )}
            {state.isParrying && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500 text-white animate-pulse">ПАРИР</span>
            )}
          </div>
        </div>

        {/* VS divider */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
          <p className="text-5xl font-black text-white">⚔</p>
        </div>

        {/* Enemy character */}
        <div className="relative z-10 flex flex-col items-center">
          {state.enemySuper && (
            <div
              className="absolute -inset-4 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${enemySuperColor}44 0%, transparent 70%)`,
                animation: "super-ring 1.5s ease-in-out infinite",
                animationDelay: "0.3s",
              }}
            />
          )}
          <div
            key={`${state.enemyAnim}-${state.enemyHP}`}
            className={cn(
              "text-7xl select-none cursor-default scale-x-[-1]",
              getAnimClass(state.enemyAnim, enemy.id, state.enemySuper)
            )}
            style={{
              filter: state.enemySuper
                ? `drop-shadow(0 0 20px ${enemySuperColor}) brightness(1.3)`
                : `drop-shadow(0 0 10px ${enemy.colorHex})`,
            }}
          >
            {state.enemySuper ? enemy.superForm?.emoji : enemy.emoji}
          </div>
        </div>

        {/* Result overlay */}
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center z-30 rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: state.phase === "player_win"
                  ? "radial-gradient(circle, rgba(250,204,21,0.3) 0%, rgba(0,0,0,0.8) 70%)"
                  : state.phase === "enemy_win"
                  ? "radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(0,0,0,0.8) 70%)"
                  : "rgba(0,0,0,0.75)",
              }}
            />
            <div className="relative z-10 text-center">
              {state.phase === "player_win" && (
                <>
                  <p className="text-5xl font-black text-yellow-400 tracking-widest" style={{ textShadow: "0 0 30px #fbbf24" }}>
                    ПОБЕДА!
                  </p>
                  <p className="text-sm text-white/70 mt-1">{state.playerSuper ? player.superForm?.name : player.name} выиграл!</p>
                </>
              )}
              {state.phase === "enemy_win" && (
                <>
                  <p className="text-5xl font-black text-red-400 tracking-widest" style={{ textShadow: "0 0 30px #ef4444" }}>
                    ПОРАЖЕНИЕ
                  </p>
                  <p className="text-sm text-white/70 mt-1">{state.enemySuper ? enemy.superForm?.name : enemy.name} победил</p>
                </>
              )}
              {state.phase === "draw" && (
                <p className="text-5xl font-black text-slate-300 tracking-widest">НИЧЬЯ</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Max combo */}
      {state.maxCombo > 1 && (
        <div className="flex items-center justify-end gap-2 px-1">
          <p className="text-[10px] text-white/30 font-bold">МАКС КОМБО:</p>
          <p className="text-[10px] font-black" style={{ color: playerDisplayColor }}>×{state.maxCombo}</p>
        </div>
      )}

      {/* Battle log */}
      <div className="rounded-xl border border-white/10 bg-black/50 p-3 min-h-[72px] backdrop-blur-sm">
        {state.log.length === 0 ? (
          <p className="text-white/25 text-xs text-center italic">Выбери действие...</p>
        ) : (
          <div className="flex flex-col gap-1">
            {state.log.map((entry, i) => (
              <p
                key={entry.id}
                className={cn(
                  "text-xs font-medium leading-tight",
                  i === 0 ? "opacity-100" : i === 1 ? "opacity-55" : i === 2 ? "opacity-30" : "opacity-15",
                  entry.type === "special" && "font-black text-yellow-300",
                  entry.type === "transform" && "font-black text-orange-300",
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
      <div className="grid grid-cols-4 gap-1.5">
        {ACTIONS.map((action) => {
          const isTransform = action.key === "transform";
          const isSpecial = action.key === "special";
          const canTransform = isTransform && player.superForm && !state.playerSuper && state.playerSuperEnergy >= 100;
          const isDisabled =
            isOver ||
            state.phase !== "fighting" ||
            (action.cost > 0 && state.playerEnergy < action.cost) ||
            (isTransform && (!player.superForm || state.playerSuper || state.playerSuperEnergy < 100));

          return (
            <button
              key={action.key}
              disabled={isDisabled}
              onClick={() => handleAction(action.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1.5 py-2.5 rounded-xl border-2 font-bold text-sm transition-all duration-150 active:scale-95",
                isTransform && canTransform
                  ? "border-orange-400 bg-orange-400/15 text-orange-300 hover:bg-orange-400/25 animate-pulse"
                  : isSpecial
                  ? "border-yellow-500/60 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-400"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/30",
                isDisabled && "opacity-25 cursor-not-allowed hover:scale-100"
              )}
            >
              <Icon
                name={action.icon}
                size={16}
                className={cn(
                  isTransform && canTransform ? "text-orange-400" :
                  isSpecial ? "text-yellow-400" : "text-white/60"
                )}
                fallback="Circle"
              />
              <span className="text-[10px] font-black leading-tight text-center">{action.label}</span>
              {action.cost > 0 && (
                <span className="text-[8px] text-white/30">-{action.cost}</span>
              )}
              {isTransform && (
                <span className="text-[8px] text-orange-400/70 font-bold">
                  {state.playerSuperEnergy >= 100 ? "ГОТОВО!" : `${state.playerSuperEnergy}%`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      {state.playerSuper && (
        <p className="text-center text-xs font-black animate-pulse" style={{ color: playerSuperColor }}>
          ⚡ {player.superForm?.name} АКТИВИРОВАН — УВЕЛИЧЕННАЯ СИЛА!
        </p>
      )}
    </div>
  );
}
