import { useEffect, useRef, useCallback } from "react";
import { Character } from "@/data/characters";
import { useFightEngine, ActionType, CharAnim } from "@/hooks/useFightEngine";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icon";

interface Props {
  player: Character;
  enemy: Character;
  onFightEnd: (result: "win" | "lose" | "draw", ringsEarned: number) => void;
}

const IDLE_ANIMS: Record<string, string> = {
  sonic: "anim-idle-fast", shadow: "anim-idle-fast", knuckles: "anim-idle-heavy",
  tails: "anim-idle-float", amy: "anim-idle", silver: "anim-idle-float",
  blaze: "anim-idle-fast", rouge: "anim-idle-float",
  naruto: "anim-idle-fast", goku: "anim-idle-fast", ichigo: "anim-idle-heavy",
  saitama: "anim-idle-heavy", mikasa: "anim-idle-float", zenitsu: "anim-idle-fast",
  dark_sonic: "anim-idle-fast",
};

function getAnimClass(anim: CharAnim, charId: string, isSuper: boolean): string {
  if (anim === "idle" || anim === "super-idle") {
    return isSuper ? "anim-super" : (IDLE_ANIMS[charId] || "anim-idle");
  }
  const map: Record<string, string> = {
    attack: (charId === "sonic" || charId === "blaze" || charId === "dark_sonic" || charId === "zenitsu") ? "anim-attack-spin" : "anim-attack",
    heavy: "anim-attack-heavy",
    hit: "anim-hit", block: "anim-block", parry: "anim-parry",
    dodge: "anim-dodge", special: "anim-attack-spin",
    transform: "anim-transform", walk: "anim-idle", crouch: "anim-block",
    jump: "anim-dodge",
  };
  return map[anim] || "anim-idle";
}

function HPBar({ current, max, color, reversed }: { current: number; max: number; color: string; reversed?: boolean }) {
  const pct = Math.max(0, (current / max) * 100);
  const danger = pct < 20 ? "#ef4444" : pct < 45 ? "#f59e0b" : color;
  return (
    <div className={cn("flex-1 flex flex-col gap-1", reversed && "items-end")}>
      <div className="w-full h-5 bg-black/70 rounded-full overflow-hidden border border-white/10 relative">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${danger}bb, ${danger})`,
            boxShadow: `0 0 10px ${danger}88`,
            float: reversed ? "right" : "left",
          }}
        />
        {pct < 20 && <div className="absolute inset-0 rounded-full animate-pulse opacity-20" style={{ background: danger }} />}
      </div>
      <p className="text-xs font-black tabular-nums" style={{ color: danger }}>{current}/{max}</p>
    </div>
  );
}

function EnergyBar({ value, color, label }: { value: number; color: string; label?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <p className="text-[8px] font-bold text-white/30 tracking-widest">{label}</p>}
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 4px ${color}66` }} />
      </div>
    </div>
  );
}

function SuperBar({ value, color }: { value: number; color: string }) {
  const full = value >= 100;
  return (
    <div className="flex flex-col gap-0.5">
      <p className={cn("text-[8px] font-black tracking-widest", full ? "text-yellow-400 animate-pulse" : "text-white/25")}>
        {full ? "⚡ SUPER!" : `SUPER ${value}%`}
      </p>
      <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
        <div className={cn("h-full rounded-full transition-all duration-500", full && "animate-pulse")}
          style={{
            width: `${value}%`,
            background: full ? `linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)` : `linear-gradient(90deg, ${color}55, ${color}99)`,
            boxShadow: full ? `0 0 10px #fbbf2488` : "none",
          }} />
      </div>
    </div>
  );
}

// Кнопки боя
const COMBAT_ACTIONS: { key: ActionType; label: string; icon: string; cost?: number; color?: string; desc: string }[] = [
  { key: "attack",    label: "Удар",    icon: "Swords",    desc: "Быстрая атака + комбо" },
  { key: "heavy",     label: "Мощный",  icon: "Zap",       cost: 20, desc: "Пробивает блок" },
  { key: "block",     label: "Блок",    icon: "Shield",    desc: "Снижает урон ~85%" },
  { key: "parry",     label: "Парир.",  icon: "RotateCcw", desc: "Контратака критом" },
  { key: "special",   label: "СПЕЦ",    icon: "Star",      cost: 40, desc: "Мощный приём", color: "#fbbf24" },
  { key: "dodge",     label: "Уклон",   icon: "Wind",      desc: "+ENG (зависит от agility)" },
  { key: "transform", label: "СУПЕР!",  icon: "Flame",     desc: "100% Super Energy нужно", color: "#f97316" },
];

// MUGEN движение
const MOVE_ACTIONS: { key: ActionType; label: string; icon: string; desc: string }[] = [
  { key: "walk_fwd",  label: "→",     icon: "ArrowRight", desc: "Вперёд" },
  { key: "walk_back", label: "←",     icon: "ArrowLeft",  desc: "Назад" },
  { key: "jump",      label: "↑",     icon: "ArrowUp",    desc: "Прыжок" },
  { key: "crouch",    label: "↓",     icon: "ArrowDown",  desc: "Присед" },
];

export default function FightArena({ player, enemy, onFightEnd }: Props) {
  const { state, startFight, playerAction, restoreEnergy, dismissTransform, standUp } = useFightEngine(player, enemy);
  const { play } = useSound();
  const prevPhase = useRef(state.phase);
  const prevCombo = useRef(0);
  const prevSuperEnergy = useRef(0);

  useEffect(() => { startFight(); }, []);

  // Результат боя
  useEffect(() => {
    if (state.phase === prevPhase.current) return;
    prevPhase.current = state.phase;
    if (state.phase === "player_win") {
      play("win");
      const rings = 100 + state.maxCombo * 20 + (state.playerSuper ? 50 : 0);
      setTimeout(() => onFightEnd("win", rings), 2200);
    } else if (state.phase === "enemy_win") {
      play("lose");
      setTimeout(() => onFightEnd("lose", 20), 2200);
    } else if (state.phase === "draw") {
      setTimeout(() => onFightEnd("draw", 40), 2200);
    }
  }, [state.phase, onFightEnd, play, state.maxCombo, state.playerSuper]);

  // Звук комбо
  useEffect(() => {
    if (state.combo > 2 && state.combo > prevCombo.current) play("combo");
    prevCombo.current = state.combo;
  }, [state.combo, play]);

  // Звук заряда super
  useEffect(() => {
    if (state.playerSuperEnergy >= 100 && prevSuperEnergy.current < 100) play("charge");
    prevSuperEnergy.current = state.playerSuperEnergy;
  }, [state.playerSuperEnergy, play]);

  // Восстановление энергии
  useEffect(() => {
    if (state.phase !== "fighting") return;
    const iv = setInterval(restoreEnergy, 2000);
    return () => clearInterval(iv);
  }, [state.phase, restoreEnergy]);

  // Трансформация
  useEffect(() => {
    if (!state.transformCutscene) return;
    play("transform");
    const t = setTimeout(dismissTransform, 2100);
    return () => clearTimeout(t);
  }, [state.transformCutscene, play, dismissTransform]);

  // Клавиатурное управление MUGEN
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (state.phase !== "fighting") return;
    const map: Record<string, ActionType> = {
      ArrowRight: "walk_fwd", ArrowLeft: "walk_back",
      ArrowUp: "jump", ArrowDown: "crouch",
      KeyZ: "attack", KeyX: "heavy", KeyA: "block",
      KeyS: "parry", KeyD: "special", KeyC: "dodge", KeyT: "transform",
    };
    const action = map[e.code];
    if (action) {
      e.preventDefault();
      if (action === "attack") play("punch");
      else if (action === "heavy") play("heavy");
      else if (action === "block") play("block");
      else if (action === "parry") play("parry");
      else if (action === "special") play("special");
      else if (action === "dodge") play("dodge");
      playerAction(action);
    }
    if (e.code === "ArrowDown") {
      setTimeout(standUp, 600);
    }
  }, [state.phase, playerAction, play, standUp]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const handleAction = (action: ActionType) => {
    if (state.phase !== "fighting") return;
    if (action === "attack") play("punch");
    else if (action === "heavy") play("heavy");
    else if (action === "block") play("block");
    else if (action === "parry") play("parry");
    else if (action === "special") play("special");
    else if (action === "dodge") play("dodge");
    else if (action === "transform") play("transform");
    if (action === "crouch") setTimeout(standUp, 600);
    playerAction(action);
  };

  const isOver = state.phase !== "fighting" && state.phase !== "idle";
  const playerColor = state.playerSuper ? (player.superForm?.colorHex || player.colorHex) : player.colorHex;
  const enemyColor = state.enemySuper ? (enemy.superForm?.colorHex || enemy.colorHex) : enemy.colorHex;
  const playerEmoji = state.playerSuper ? (player.superForm?.emoji || player.emoji) : player.emoji;
  const enemyEmoji = state.enemySuper ? (enemy.superForm?.emoji || enemy.emoji) : enemy.emoji;

  return (
    <div className={cn("flex flex-col gap-3 w-full max-w-2xl mx-auto relative", state.shakeScreen && "shake")}>

      {/* Transform cutscene */}
      {state.transformCutscene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ animation: "transform-flash 2.1s ease forwards" }}>
          <div className="absolute inset-0" style={{
            background: state.transformSide === "player"
              ? `radial-gradient(circle, ${player.superForm?.colorHex || player.colorHex}cc 0%, transparent 65%)`
              : `radial-gradient(circle, ${enemy.superForm?.colorHex || enemy.colorHex}cc 0%, transparent 65%)`,
          }} />
          <div className="relative z-10 text-center" style={{ animation: "transform-text 2.1s ease forwards" }}>
            <div className="text-8xl mb-3" style={{ animation: "transform-char 2.1s ease forwards" }}>
              {state.transformSide === "player" ? player.superForm?.emoji : enemy.superForm?.emoji}
            </div>
            <p className="text-4xl font-black tracking-widest"
              style={{ color: state.transformSide === "player" ? player.superForm?.colorHex : enemy.superForm?.colorHex }}>
              {state.transformSide === "player" ? player.superForm?.name : enemy.superForm?.name}
            </p>
          </div>
        </div>
      )}

      {/* HP bars */}
      <div className="flex items-start gap-2 px-1">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-xl">{playerEmoji}</span>
            <span className="font-black text-white text-xs truncate">
              {state.playerSuper ? player.superForm?.name : player.name}
            </span>
            {state.combo > 1 && (
              <span key={state.combo} className="text-[9px] font-black px-1.5 py-0.5 rounded-full anim-combo-pop shrink-0"
                style={{ background: playerColor, color: "#000" }}>×{state.combo}</span>
            )}
          </div>
          <HPBar current={state.playerHP} max={state.playerMaxHP} color={playerColor} />
          <EnergyBar value={state.playerEnergy} color={playerColor} label={`ENG ${state.playerEnergy}`} />
          {player.superForm && <SuperBar value={state.playerSuperEnergy} color={playerColor} />}
        </div>

        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <p className="text-xs font-black text-white/25">VS</p>
          {state.maxCombo > 1 && (
            <p className="text-[8px] font-bold text-white/25">×{state.maxCombo}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 flex-1 items-end min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-row-reverse flex-wrap">
            <span className="text-xl">{enemyEmoji}</span>
            <span className="font-black text-white text-xs truncate">
              {state.enemySuper ? enemy.superForm?.name : enemy.name}
            </span>
          </div>
          <HPBar current={state.enemyHP} max={state.enemyMaxHP} color={enemyColor} reversed />
          <EnergyBar value={state.enemyEnergy} color={enemyColor} />
          {enemy.superForm && (
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${state.enemyEnergy}%`, background: `linear-gradient(90deg, ${enemyColor}66, ${enemyColor}aa)` }} />
            </div>
          )}
        </div>
      </div>

      {/* ARENA */}
      <div className="relative rounded-2xl border border-white/10 overflow-hidden"
        style={{
          height: 180,
          background: `linear-gradient(160deg, ${playerColor}18 0%, #020008 50%, ${enemyColor}18 100%)`,
        }}>

        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-8"
          style={{ background: "linear-gradient(0deg, rgba(255,255,255,0.04) 0%, transparent 100%)" }} />

        {/* Scanlines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)" }} />

        {/* Super glow */}
        {state.playerSuper && (
          <div className="absolute left-0 top-0 bottom-0 w-1/2 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 20% 50%, ${player.superForm?.colorHex || playerColor}28 0%, transparent 70%)`, animation: "super-bg-pulse 1.1s ease-in-out infinite" }} />
        )}
        {state.enemySuper && (
          <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 80% 50%, ${enemy.superForm?.colorHex || enemyColor}28 0%, transparent 70%)`, animation: "super-bg-pulse 1.1s ease-in-out infinite" }} />
        )}

        {/* Hit flashes */}
        {state.hitFlashPlayer && (
          <div className="absolute left-0 top-0 bottom-0 w-1/2 pointer-events-none z-10"
            style={{ background: "rgba(255,40,40,0.35)", animation: "hit-flash 0.35s ease forwards" }} />
        )}
        {state.hitFlashEnemy && (
          <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none z-10"
            style={{ background: "rgba(255,40,40,0.35)", animation: "hit-flash 0.35s ease forwards" }} />
        )}

        {/* Particles */}
        {state.particles.map(p => (
          <div key={p.id} className="absolute pointer-events-none z-20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, "--px": `${p.px}px`, "--py": `${p.py}px`, animation: "particle-fly 0.65s ease-out forwards" } as React.CSSProperties}>
            {p.shape === "ring" ? (
              <div style={{ width: p.size * 2, height: p.size * 2, borderRadius: "50%", border: `2px solid ${p.color}`, animation: "particle-ring 0.5s ease-out forwards" }} />
            ) : p.shape === "star" ? (
              <div style={{ color: p.color, fontSize: p.size * 2, lineHeight: 1, textShadow: `0 0 8px ${p.color}` }}>★</div>
            ) : (
              <div style={{ width: p.size, height: p.size, borderRadius: "50%", background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />
            )}
          </div>
        ))}

        {/* PLAYER — позиционируется по playerX */}
        <div
          className="absolute bottom-6 z-10 flex flex-col items-center transition-all duration-200"
          style={{ left: `${state.playerX}%`, transform: "translateX(-50%)" }}
        >
          {state.playerSuper && (
            <div className="absolute -inset-6 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${player.superForm?.colorHex || playerColor}44 0%, transparent 70%)`, animation: "super-ring 1.5s ease-in-out infinite" }} />
          )}
          <div
            key={`pa-${state.playerAnim}-${state.playerHP}`}
            className={cn("select-none text-6xl", getAnimClass(state.playerAnim, player.id, state.playerSuper),
              state.playerCrouching && "scale-y-75 origin-bottom")}
            style={{
              filter: state.playerSuper
                ? `drop-shadow(0 0 18px ${player.superForm?.colorHex || playerColor}) brightness(1.3)`
                : `drop-shadow(0 0 10px ${player.colorHex})`,
              "--super-glow": player.superForm?.colorHex || playerColor,
              transform: state.playerY > 0 ? "translateY(-28px)" : undefined,
            } as React.CSSProperties}
          >
            {playerEmoji}
          </div>
          <div className="flex gap-1 h-4 mt-0.5 items-center">
            {state.isBlocking && <span className="text-[8px] font-black px-1 rounded bg-blue-500 text-white">БЛК</span>}
            {state.isParrying && <span className="text-[8px] font-black px-1 rounded bg-purple-500 text-white animate-pulse">ПАР</span>}
            {state.playerCrouching && <span className="text-[8px] font-black px-1 rounded bg-green-600 text-white">↓</span>}
          </div>
        </div>

        {/* Center sword */}
        <div className="absolute left-1/2 bottom-6 -translate-x-1/2 opacity-8 pointer-events-none">
          <p className="text-4xl font-black text-white/5">⚔</p>
        </div>

        {/* ENEMY — позиционируется по enemyX */}
        <div
          className="absolute bottom-6 z-10 flex flex-col items-center transition-all duration-200"
          style={{ left: `${state.enemyX}%`, transform: "translateX(-50%)" }}
        >
          {state.enemySuper && (
            <div className="absolute -inset-6 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${enemy.superForm?.colorHex || enemyColor}44 0%, transparent 70%)`, animation: "super-ring 1.5s ease-in-out infinite", animationDelay: "0.3s" }} />
          )}
          <div
            key={`ea-${state.enemyAnim}-${state.enemyHP}`}
            className={cn("select-none text-6xl scale-x-[-1]", getAnimClass(state.enemyAnim, enemy.id, state.enemySuper))}
            style={{
              filter: state.enemySuper
                ? `drop-shadow(0 0 18px ${enemy.superForm?.colorHex || enemyColor}) brightness(1.3)`
                : `drop-shadow(0 0 10px ${enemy.colorHex})`,
            }}
          >
            {enemyEmoji}
          </div>
        </div>

        {/* Distance indicator */}
        {state.distance > 50 && state.phase === "fighting" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] text-white/30 font-bold">
            ← СБЛИЗЬСЯ →
          </div>
        )}

        {/* Result overlay */}
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center z-30 rounded-2xl overflow-hidden">
            <div className="absolute inset-0" style={{
              background: state.phase === "player_win"
                ? "radial-gradient(circle, rgba(250,204,21,0.35) 0%, rgba(0,0,0,0.8) 70%)"
                : state.phase === "enemy_win"
                ? "radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(0,0,0,0.82) 70%)"
                : "rgba(0,0,0,0.78)",
            }} />
            <div className="relative z-10 text-center">
              {state.phase === "player_win" && (
                <>
                  <p className="text-5xl font-black text-yellow-400 tracking-widest" style={{ textShadow: "0 0 30px #fbbf24" }}>ПОБЕДА!</p>
                  <p className="text-xs text-white/60 mt-1">+{100 + state.maxCombo * 20} 💍</p>
                </>
              )}
              {state.phase === "enemy_win" && <p className="text-5xl font-black text-red-400 tracking-widest">ПОРАЖЕНИЕ</p>}
              {state.phase === "draw" && <p className="text-5xl font-black text-slate-300 tracking-widest">НИЧЬЯ</p>}
            </div>
          </div>
        )}
      </div>

      {/* Battle log */}
      <div className="rounded-xl border border-white/10 bg-black/50 p-2.5 min-h-[64px] backdrop-blur-sm">
        {state.log.length === 0
          ? <p className="text-white/20 text-xs text-center italic">Нажми кнопку или клавишу Z/X/A/S/D/C...</p>
          : state.log.map((entry, i) => (
            <p key={entry.id} className={cn(
              "text-xs font-medium leading-tight",
              i === 0 ? "opacity-100" : i === 1 ? "opacity-50" : i === 2 ? "opacity-25" : "opacity-10",
              entry.type === "special" && "font-black text-yellow-300",
              entry.type === "transform" && "font-black text-orange-300",
              entry.type === "player" && "text-white",
              entry.type === "enemy" && "text-red-300",
              entry.type === "system" && "text-slate-400 italic",
            )}>
              {entry.text}
            </p>
          ))
        }
      </div>

      {/* MUGEN movement */}
      <div className="flex gap-1.5 justify-center">
        {MOVE_ACTIONS.map(a => (
          <button key={a.key} onClick={() => handleAction(a.key)}
            disabled={isOver}
            title={a.desc}
            className="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/15 hover:border-white/35 transition-all active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed font-black text-sm">
            {a.label}
          </button>
        ))}
      </div>

      {/* Combat buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {COMBAT_ACTIONS.map(action => {
          const isSpecial = action.key === "special";
          const isTransform = action.key === "transform";
          const canTransform = isTransform && player.superForm && !state.playerSuper && state.playerSuperEnergy >= 100;
          const disabled =
            isOver || state.phase !== "fighting" ||
            (action.cost && state.playerEnergy < action.cost) ||
            (isTransform && (!player.superForm || state.playerSuper || state.playerSuperEnergy < 100));

          return (
            <button
              key={action.key}
              disabled={!!disabled}
              title={action.desc}
              onClick={() => handleAction(action.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-2.5 rounded-xl border-2 font-black text-xs transition-all active:scale-90",
                isTransform && canTransform ? "border-orange-400 bg-orange-400/15 text-orange-300 hover:bg-orange-400/25 animate-pulse"
                  : isSpecial ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/12 hover:border-white/25",
                !!disabled && "opacity-20 cursor-not-allowed"
              )}
            >
              <Icon name={action.icon} size={15}
                className={cn(isTransform && canTransform ? "text-orange-400" : isSpecial ? "text-yellow-400" : "text-white/55")}
                fallback="Circle" />
              <span className="text-[9px] font-black">{action.label}</span>
              {action.cost && <span className="text-[7px] text-white/30">-{action.cost}</span>}
              {isTransform && player.superForm && (
                <span className="text-[7px] font-bold" style={{ color: state.playerSuperEnergy >= 100 ? "#f97316" : "#ffffff44" }}>
                  {state.playerSuperEnergy >= 100 ? "READY" : `${state.playerSuperEnergy}%`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Controls hint */}
      <p className="text-[9px] text-white/20 text-center font-bold tracking-wider">
        Клавиши: ←→↑↓ движение · Z атака · X мощный · A блок · S парир · D спец · C уклон · T супер
      </p>

      {state.playerSuper && (
        <p className="text-center text-xs font-black animate-pulse" style={{ color: player.superForm?.colorHex || playerColor }}>
          ⚡ {player.superForm?.name} — СИЛА УСИЛЕНА!
        </p>
      )}
    </div>
  );
}
