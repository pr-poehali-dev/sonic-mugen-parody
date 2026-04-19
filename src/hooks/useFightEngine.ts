import { useState, useCallback, useEffect, useRef } from "react";
import { Character } from "@/data/characters";

export type FightPhase = "idle" | "fighting" | "player_win" | "enemy_win" | "draw";
export type ActionType = "attack" | "heavy" | "block" | "parry" | "special" | "dodge" | "transform" | "walk_fwd" | "walk_back" | "jump" | "crouch";
export type CharAnim = "idle" | "attack" | "heavy" | "hit" | "block" | "parry" | "dodge" | "special" | "transform" | "super-idle" | "walk" | "jump" | "crouch";

export interface BattleLog {
  id: number;
  text: string;
  type: "player" | "enemy" | "system" | "special" | "transform";
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  px: number;
  py: number;
  shape: "circle" | "star" | "ring";
}

interface FightState {
  playerHP: number;
  enemyHP: number;
  playerMaxHP: number;
  enemyMaxHP: number;
  playerEnergy: number;
  enemyEnergy: number;
  playerSuperEnergy: number;
  phase: FightPhase;
  log: BattleLog[];
  combo: number;
  maxCombo: number;
  isBlocking: boolean;
  isParrying: boolean;
  playerAnim: CharAnim;
  enemyAnim: CharAnim;
  playerSuper: boolean;
  enemySuper: boolean;
  shakeScreen: boolean;
  hitFlashPlayer: boolean;
  hitFlashEnemy: boolean;
  particles: Particle[];
  roundNumber: number;
  transformCutscene: boolean;
  transformSide: "player" | "enemy" | null;
  // MUGEN позиции (0-100)
  playerX: number;
  enemyX: number;
  playerY: number;  // 0 = земля, >0 = в воздухе
  playerCrouching: boolean;
  distance: number; // расстояние между бойцами (0-100)
}

// ── Реальный расчёт урона через характеристики ──
function calcDamage(
  attacker: Character,
  defender: Character,
  isHeavy: boolean,
  isSuper: boolean,
  isCrit: boolean,
  isDefending: boolean,
  isCrouching: boolean
): number {
  // Базовый урон: сила * 2.5 + случайность
  const baseDmg = attacker.power * 2.5 + Math.random() * attacker.power;

  // Коэффициент типа атаки
  const typeMult = isHeavy ? 1.8 : 1;

  // Супер-форма усиление
  const superMult = isSuper && attacker.superForm ? attacker.superForm.powerBoost * 0.7 : 1;

  // Крит
  const critMult = isCrit ? 1.6 : 1;

  // Защита противника: снижает урон на (defense - 1) * 3%
  const defReduction = isDefending
    ? Math.max(0.1, 1 - (defender.defense * 0.08))
    : Math.max(0.35, 1 - (defender.defense * 0.025));

  // Приседание даёт +15% защиту от обычных ударов (не тяжёлых)
  const crouchMult = (isCrouching && !isHeavy) ? 0.7 : 1;

  const dmg = Math.round(baseDmg * typeMult * superMult * critMult * defReduction * crouchMult);
  return Math.max(1, dmg);
}

function isCriticalHit(attacker: Character, isSuper: boolean): boolean {
  const chance = attacker.critChance + (isSuper ? 10 : 0);
  return Math.random() * 100 < chance;
}

let particleId = 0;
function makeParticles(color: string, count = 8, isSpecial = false, isCrit = false): Particle[] {
  return Array.from({ length: count }, () => {
    particleId++;
    const angle = Math.random() * Math.PI * 2;
    const dist = isSpecial ? 60 + Math.random() * 80 : isCrit ? 45 + Math.random() * 60 : 25 + Math.random() * 40;
    return {
      id: particleId,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50 + (Math.random() - 0.5) * 20,
      color: isCrit ? "#fbbf24" : color,
      size: isSpecial ? 7 + Math.random() * 8 : isCrit ? 6 + Math.random() * 6 : 3 + Math.random() * 5,
      px: Math.cos(angle) * dist,
      py: Math.sin(angle) * dist - (isSpecial ? 25 : 12),
      shape: isSpecial ? (Math.random() > 0.5 ? "star" : "ring") : isCrit ? "star" : "circle",
    };
  });
}

// Скорость хода зависит от speed (1-10)
function getMoveSpeed(char: Character): number {
  return 4 + char.speed * 1.5; // 5.5 to 19
}

// Задержка ответа ИИ зависит от speed врага (быстрые — отвечают быстрее)
function getEnemyDelay(enemy: Character): number {
  return Math.max(500, 1400 - enemy.speed * 80);
}

export function useFightEngine(player: Character, enemy: Character) {
  const logId = useRef(0);
  const enemyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // HP зависит от maxHP персонажа
  const playerMaxHP = player.maxHP;
  const enemyMaxHP = enemy.maxHP;

  const initialState: FightState = {
    playerHP: playerMaxHP,
    enemyHP: enemyMaxHP,
    playerMaxHP,
    enemyMaxHP,
    playerEnergy: 100,
    enemyEnergy: 100,
    playerSuperEnergy: 0,
    phase: "idle",
    log: [],
    combo: 0,
    maxCombo: 0,
    isBlocking: false,
    isParrying: false,
    playerAnim: "idle",
    enemyAnim: "idle",
    playerSuper: false,
    enemySuper: false,
    shakeScreen: false,
    hitFlashPlayer: false,
    hitFlashEnemy: false,
    particles: [],
    roundNumber: 1,
    transformCutscene: false,
    transformSide: null,
    playerX: 20,
    enemyX: 75,
    playerY: 0,
    playerCrouching: false,
    distance: 55,
  };

  const [state, setState] = useState<FightState>(initialState);

  const resetAnim = useCallback((side: "player" | "enemy", delay = 420) => {
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => {
      setState(s => ({
        ...s,
        playerAnim: side === "player" ? (s.playerSuper ? "super-idle" : "idle") : s.playerAnim,
        enemyAnim: side === "enemy" ? (s.enemySuper ? "super-idle" : "idle") : s.enemyAnim,
        shakeScreen: false,
        hitFlashPlayer: false,
        hitFlashEnemy: false,
      }));
    }, delay);
  }, []);

  const clearParticles = useCallback(() => {
    if (particleTimer.current) clearTimeout(particleTimer.current);
    particleTimer.current = setTimeout(() => {
      setState(s => ({ ...s, particles: [] }));
    }, 700);
  }, []);

  const startFight = useCallback(() => {
    setState({ ...initialState, phase: "fighting" });
    logId.current = 0;
  }, [playerMaxHP, enemyMaxHP]);

  const checkEnd = useCallback((pHP: number, eHP: number): FightPhase | null => {
    if (pHP <= 0 && eHP <= 0) return "draw";
    if (pHP <= 0) return "enemy_win";
    if (eHP <= 0) return "player_win";
    return null;
  }, []);

  const enemyAI = useCallback(() => {
    setState(s => {
      if (s.phase !== "fighting") return s;

      const rnd = Math.random();
      // ИИ умнее если speed выше
      const smartness = enemy.speed / 10;
      const agility = enemy.agility / 10;

      let action: ActionType;

      // Трансформация — если накоплена энергия
      if (!s.enemySuper && enemy.superForm && s.enemyEnergy >= 80 && rnd < 0.2 * smartness) {
        action = "transform";
      } else if (s.distance > 60 && rnd < 0.4) {
        // Сближение — ходьба вперёд
        action = "walk_fwd";
      } else if (s.enemyHP < enemyMaxHP * 0.3 && s.enemyEnergy >= 40 && rnd < 0.4) {
        action = "special";
      } else if (s.isBlocking && rnd < 0.4 * smartness) {
        action = "heavy";
      } else if (s.combo > 2 && rnd < 0.5 * agility) {
        action = rnd < 0.5 ? "block" : "dodge";
      } else if (s.distance < 20 && rnd < 0.3) {
        action = "walk_back";
      } else {
        const pool: ActionType[] = ["attack", "attack", "attack", "heavy", "block", "parry", "dodge"];
        action = pool[Math.floor(Math.random() * pool.length)];
      }

      if (action === "walk_fwd") {
        const spd = getMoveSpeed(enemy);
        const newEX = Math.max(s.playerX + 15, Math.min(95, s.enemyX - spd * 0.5));
        return { ...s, enemyX: newEX, enemyAnim: "walk", distance: newEX - s.playerX };
      }
      if (action === "walk_back") {
        const spd = getMoveSpeed(enemy);
        const newEX = Math.min(95, s.enemyX + spd * 0.4);
        return { ...s, enemyX: newEX, enemyAnim: "idle", distance: newEX - s.playerX };
      }
      if (action === "transform") {
        logId.current++;
        return {
          ...s, enemySuper: true, enemyEnergy: Math.max(0, s.enemyEnergy - 80),
          enemyAnim: "transform", transformCutscene: true, transformSide: "enemy",
          log: [{ id: logId.current, text: `💥 ${enemy.name}: ${enemy.superForm?.transformText || "ТРАНСФОРМАЦИЯ!"}`, type: "transform" }, ...s.log].slice(0, 6),
        };
      }

      // Расстояние влияет на попадание (только близкие атаки)
      const canHit = s.distance < 45;
      if ((action === "attack" || action === "heavy") && !canHit) {
        // Промах — ИИ идёт вперёд
        const spd = getMoveSpeed(enemy);
        return { ...s, enemyX: Math.max(s.playerX + 15, s.enemyX - spd * 0.5), enemyAnim: "walk" };
      }

      let newPlayerHP = s.playerHP;
      let newEnemyEnergy = Math.min(100, s.enemyEnergy + 4);
      let logText = "";
      let logType: BattleLog["type"] = "enemy";
      let playerAnim: CharAnim = s.playerAnim;
      let shakeScreen = false;
      let hitFlashPlayer = false;
      let newParticles: Particle[] = [];

      if (action === "attack") {
        const crit = isCriticalHit(enemy, s.enemySuper);
        if (s.isBlocking) {
          const dmg = Math.ceil(calcDamage(enemy, player, false, s.enemySuper, false, true, s.playerCrouching) * 0.15);
          newPlayerHP = Math.max(0, s.playerHP - dmg);
          logText = `${enemy.name} атакует — заблокировано! (-${dmg} HP)`;
          playerAnim = "block";
          newParticles = makeParticles("#3b82f6", 5);
        } else if (s.isParrying) {
          const counterDmg = calcDamage(player, enemy, false, s.playerSuper, true, false, false);
          logId.current++;
          return {
            ...s,
            enemyHP: Math.max(0, s.enemyHP - counterDmg),
            playerAnim: "parry", enemyAnim: "hit",
            shakeScreen: true, hitFlashEnemy: true,
            particles: makeParticles(player.colorHex, 14, true, true),
            combo: s.combo + 1, maxCombo: Math.max(s.maxCombo, s.combo + 1),
            log: [{ id: logId.current, text: `⚡ ПАРИРОВАНИЕ! ${player.name} контратакует критически! (-${counterDmg} HP)`, type: "special" }, ...s.log].slice(0, 6),
            phase: checkEnd(s.playerHP, Math.max(0, s.enemyHP - counterDmg)) || "fighting",
          };
        } else {
          const dmg = calcDamage(enemy, player, false, s.enemySuper, crit, false, s.playerCrouching);
          newPlayerHP = Math.max(0, s.playerHP - dmg);
          logText = crit
            ? `💥 КРИТ! ${enemy.name} наносит ${dmg} урона!`
            : `${enemy.name} атакует! (-${dmg} HP)`;
          logType = crit ? "special" : "enemy";
          playerAnim = "hit";
          shakeScreen = crit;
          hitFlashPlayer = true;
          newParticles = makeParticles(enemy.colorHex, crit ? 10 : 6, false, crit);
        }
      } else if (action === "heavy") {
        const dmg = calcDamage(enemy, player, true, s.enemySuper, false, false, false);
        const blockedDmg = s.isBlocking ? Math.ceil(dmg * 0.5) : dmg;
        newPlayerHP = Math.max(0, s.playerHP - blockedDmg);
        logText = s.isBlocking
          ? `${enemy.name} МОЩНЫЙ УДАР пробивает блок! (-${blockedDmg} HP)`
          : `${enemy.name} СОКРУШИТЕЛЬНЫЙ УДАР! (-${dmg} HP)`;
        playerAnim = "hit";
        shakeScreen = true;
        hitFlashPlayer = true;
        newParticles = makeParticles(enemy.colorHex, 12);
      } else if (action === "special") {
        const sMult = s.enemySuper && enemy.superForm ? enemy.superForm.powerBoost : 1;
        const dmg = Math.round(enemy.power * 4 * sMult + 15);
        newPlayerHP = Math.max(0, s.playerHP - dmg);
        newEnemyEnergy = Math.max(0, s.enemyEnergy - 40);
        logText = `✨ ${enemy.name}: ${enemy.special}! (-${dmg} HP)`;
        logType = "special";
        playerAnim = "hit";
        shakeScreen = true;
        hitFlashPlayer = true;
        newParticles = makeParticles(enemy.colorHex, 22, true);
      } else if (action === "dodge") {
        newEnemyEnergy = Math.min(100, s.enemyEnergy + 15);
        logText = `${enemy.name} уклоняется!`;
        return { ...s, enemyEnergy: newEnemyEnergy, enemyAnim: "dodge", log: [{ id: ++logId.current, text: logText, type: "enemy" }, ...s.log].slice(0, 6) };
      } else {
        return { ...s, enemyAnim: "block", log: [{ id: ++logId.current, text: `${enemy.name} блокирует`, type: "system" }, ...s.log].slice(0, 6) };
      }

      logId.current++;
      return {
        ...s, playerHP: newPlayerHP, enemyEnergy: newEnemyEnergy,
        playerAnim, enemyAnim: action === "heavy" ? "heavy" : "attack",
        shakeScreen, hitFlashPlayer, particles: newParticles,
        log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        phase: checkEnd(newPlayerHP, s.enemyHP) || "fighting",
        isBlocking: false, isParrying: false,
      };
    });
  }, [enemy, player, checkEnd, enemyMaxHP]);

  const playerAction = useCallback((action: ActionType) => {
    if (enemyTimer.current) clearTimeout(enemyTimer.current);
    if (jumpTimer.current) clearTimeout(jumpTimer.current);

    setState(s => {
      if (s.phase !== "fighting") return s;

      // MUGEN движение
      if (action === "walk_fwd") {
        const spd = getMoveSpeed(player);
        const newX = Math.min(s.enemyX - 12, s.playerX + spd * 0.5);
        return { ...s, playerX: newX, playerAnim: "walk", distance: s.enemyX - newX };
      }
      if (action === "walk_back") {
        const spd = getMoveSpeed(player);
        const newX = Math.max(5, s.playerX - spd * 0.4);
        return { ...s, playerX: newX, playerAnim: "idle", distance: s.enemyX - newX };
      }
      if (action === "jump") {
        return { ...s, playerY: 1, playerAnim: "jump" };
      }
      if (action === "crouch") {
        return { ...s, playerCrouching: true, playerAnim: "crouch" };
      }

      // Трансформация
      if (action === "transform") {
        if (!player.superForm || s.playerSuper || s.playerSuperEnergy < 100) {
          return { ...s, log: [{ id: ++logId.current, text: "Нужно 100% SUPER ENERGY!", type: "system" }, ...s.log].slice(0, 6) };
        }
        logId.current++;
        return {
          ...s, playerSuper: true, playerSuperEnergy: 0,
          playerAnim: "transform", transformCutscene: true, transformSide: "player",
          log: [{ id: logId.current, text: `💥 ${player.name}: ${player.superForm.transformText}`, type: "transform" }, ...s.log].slice(0, 6),
        };
      }

      let newEnemyHP = s.enemyHP;
      const newPlayerHP = s.playerHP;
      let newPlayerEnergy = s.playerEnergy;
      let newSuperEnergy = s.playerSuperEnergy;
      let newCombo = s.combo;
      let logText = "";
      let logType: BattleLog["type"] = "player";
      let playerAnim: CharAnim = "idle";
      let enemyAnim: CharAnim = s.enemyAnim;
      let shakeScreen = false;
      let hitFlashEnemy = false;
      let newParticles: Particle[] = [];
      let isCrit = false;

      // Дистанция: нужно быть близко для ударов
      const canHit = s.distance < 45;

      if (action === "attack") {
        if (!canHit) {
          return { ...s, playerX: Math.min(s.enemyX - 12, s.playerX + getMoveSpeed(player) * 0.5), playerAnim: "walk", log: [{ id: ++logId.current, text: `${player.name} сближается...`, type: "system" }, ...s.log].slice(0, 6) };
        }
        isCrit = isCriticalHit(player, s.playerSuper);
        const comboBonus = newCombo > 1 ? Math.floor(newCombo * player.power * 0.3) : 0;
        const dmg = calcDamage(player, enemy, false, s.playerSuper, isCrit, false, false) + comboBonus;
        newEnemyHP = Math.max(0, s.enemyHP - dmg);
        newCombo = s.combo + 1;
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 7);
        const comboStr = newCombo > 2 ? ` 🔥×${newCombo}` : "";
        logText = isCrit
          ? `💥 КРИТ${comboStr}! ${player.name} наносит ${dmg} урона!`
          : `${player.name} атакует${comboStr}! (-${dmg} HP)`;
        logType = isCrit ? "special" : "player";
        playerAnim = "attack";
        enemyAnim = "hit";
        shakeScreen = isCrit || newCombo > 3;
        hitFlashEnemy = true;
        newParticles = makeParticles(player.colorHex, newCombo > 3 ? 14 : 7, false, isCrit);
      } else if (action === "heavy") {
        if (newPlayerEnergy < 20) {
          return { ...s, log: [{ id: ++logId.current, text: "Мало энергии для мощного удара!", type: "system" }, ...s.log].slice(0, 6) };
        }
        if (!canHit) {
          return { ...s, log: [{ id: ++logId.current, text: "Слишком далеко для мощного удара!", type: "system" }, ...s.log].slice(0, 6) };
        }
        const dmg = calcDamage(player, enemy, true, s.playerSuper, false, false, false);
        newEnemyHP = Math.max(0, s.enemyHP - dmg);
        newPlayerEnergy = Math.max(0, s.playerEnergy - 20);
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 15);
        newCombo = s.combo + 1;
        logText = `${player.name} МОЩНЫЙ УДАР! (-${dmg} HP)`;
        playerAnim = "heavy";
        enemyAnim = "hit";
        shakeScreen = true;
        hitFlashEnemy = true;
        newParticles = makeParticles(player.colorHex, 16, true);
      } else if (action === "special") {
        if (newPlayerEnergy < 40) {
          return { ...s, log: [{ id: ++logId.current, text: "Мало энергии для спецприёма!", type: "system" }, ...s.log].slice(0, 6) };
        }
        const sMult = s.playerSuper && player.superForm ? player.superForm.powerBoost : 1;
        const dmg = Math.round(player.power * 4 * sMult + 18);
        newEnemyHP = Math.max(0, s.enemyHP - dmg);
        newPlayerEnergy = Math.max(0, s.playerEnergy - 40);
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 20);
        newCombo = 0;
        logText = `✨ ${player.special}! (-${dmg} HP)`;
        logType = "special";
        playerAnim = "special";
        enemyAnim = "hit";
        shakeScreen = true;
        hitFlashEnemy = true;
        newParticles = makeParticles(player.colorHex, 26, true);
      } else if (action === "block") {
        return { ...s, isBlocking: true, isParrying: false, combo: 0, playerCrouching: false, playerAnim: "block",
          log: [{ id: ++logId.current, text: `${player.name} блокирует`, type: "system" }, ...s.log].slice(0, 6) };
      } else if (action === "parry") {
        return { ...s, isParrying: true, isBlocking: false, combo: 0, playerCrouching: false, playerAnim: "parry",
          log: [{ id: ++logId.current, text: `${player.name} готов к парированию! ⚡`, type: "system" }, ...s.log].slice(0, 6) };
      } else if (action === "dodge") {
        newCombo = 0;
        newPlayerEnergy = Math.min(100, s.playerEnergy + 18);
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 5);
        // Уклон зависит от agility — высокий agility даёт больше энергии
        const agilityBonus = Math.floor(player.agility * 1.5);
        newPlayerEnergy = Math.min(100, s.playerEnergy + 18 + agilityBonus);
        logText = `${player.name} уклоняется! (+${18 + agilityBonus} ENG)`;
        playerAnim = "dodge";
        return { ...s, playerEnergy: newPlayerEnergy, playerSuperEnergy: newSuperEnergy, combo: 0, playerAnim, playerCrouching: false,
          log: [{ id: ++logId.current, text: logText, type: "system" }, ...s.log].slice(0, 6) };
      }

      logId.current++;
      return {
        ...s, enemyHP: newEnemyHP, playerHP: newPlayerHP,
        playerEnergy: newPlayerEnergy, playerSuperEnergy: newSuperEnergy,
        combo: newCombo, maxCombo: Math.max(s.maxCombo, newCombo),
        log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        phase: checkEnd(newPlayerHP, newEnemyHP) || "fighting",
        playerAnim, enemyAnim, shakeScreen,
        hitFlashEnemy, hitFlashPlayer: false,
        particles: newParticles,
        isBlocking: false, isParrying: false, playerCrouching: false,
      };
    });

    resetAnim("player");
    clearParticles();

    // ИИ отвечает с задержкой, зависящей от скорости врага
    const delay = getEnemyDelay(enemy);
    enemyTimer.current = setTimeout(() => {
      enemyAI();
      resetAnim("enemy", 420);
      clearParticles();
    }, delay);
  }, [player, enemy, checkEnd, enemyAI, resetAnim, clearParticles]);

  // Сброс приседа
  const standUp = useCallback(() => {
    setState(s => ({ ...s, playerCrouching: false, playerAnim: s.playerSuper ? "super-idle" : "idle" }));
  }, []);

  // Сброс прыжка
  useEffect(() => {
    if (state.playerY > 0) {
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
      jumpTimer.current = setTimeout(() => {
        setState(s => ({ ...s, playerY: 0, playerAnim: s.playerSuper ? "super-idle" : "idle" }));
      }, 600);
    }
  }, [state.playerY]);

  const restoreEnergy = useCallback(() => {
    setState(s => {
      if (s.phase !== "fighting") return s;
      return {
        ...s,
        playerEnergy: Math.min(100, s.playerEnergy + 7),
        enemyEnergy: Math.min(100, s.enemyEnergy + 6),
      };
    });
  }, []);

  const dismissTransform = useCallback(() => {
    setState(s => ({ ...s, transformCutscene: false, transformSide: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (enemyTimer.current) clearTimeout(enemyTimer.current);
      if (animTimer.current) clearTimeout(animTimer.current);
      if (particleTimer.current) clearTimeout(particleTimer.current);
      if (jumpTimer.current) clearTimeout(jumpTimer.current);
    };
  }, []);

  return { state, startFight, playerAction, restoreEnergy, dismissTransform, standUp };
}
