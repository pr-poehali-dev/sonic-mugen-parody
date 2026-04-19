import { useState, useCallback, useEffect, useRef } from "react";
import { Character } from "@/data/characters";

export type FightPhase = "idle" | "fighting" | "transforming" | "player_win" | "enemy_win" | "draw";
export type ActionType = "attack" | "heavy" | "block" | "parry" | "special" | "dodge" | "transform";
export type CharAnim = "idle" | "attack" | "heavy" | "hit" | "block" | "parry" | "dodge" | "special" | "transform" | "super-idle";

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
  lastAction: ActionType | null;
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
}

const calcDamage = (attacker: Character, base: number, isHeavy: boolean, isSuper: boolean) => {
  const superMult = isSuper && attacker.superForm ? attacker.superForm.powerBoost * 0.6 : 1;
  const mult = (isHeavy ? 1.6 : 1) * superMult;
  return Math.round((base + attacker.power * 1.5) * mult);
};

let particleId = 0;
const makeParticles = (color: string, count = 8, isSpecial = false): Particle[] => {
  return Array.from({ length: count }, () => {
    particleId++;
    const angle = Math.random() * Math.PI * 2;
    const dist = isSpecial ? 60 + Math.random() * 80 : 30 + Math.random() * 50;
    return {
      id: particleId,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50 + (Math.random() - 0.5) * 20,
      color,
      size: isSpecial ? 6 + Math.random() * 8 : 3 + Math.random() * 5,
      px: Math.cos(angle) * dist,
      py: Math.sin(angle) * dist - (isSpecial ? 20 : 10),
      shape: isSpecial ? (Math.random() > 0.5 ? "star" : "ring") : "circle",
    };
  });
};

const ENEMY_THINK_DELAY = 1000;

export function useFightEngine(player: Character, enemy: Character) {
  const maxHP = 120;
  const logId = useRef(0);
  const enemyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialState: FightState = {
    playerHP: maxHP,
    enemyHP: maxHP,
    playerMaxHP: maxHP,
    enemyMaxHP: maxHP,
    playerEnergy: 100,
    enemyEnergy: 100,
    playerSuperEnergy: 0,
    phase: "idle",
    log: [],
    combo: 0,
    maxCombo: 0,
    isBlocking: false,
    isParrying: false,
    lastAction: null,
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
  };

  const [state, setState] = useState<FightState>(initialState);

  const resetAnim = useCallback((side: "player" | "enemy") => {
    if (animTimer.current) clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => {
      setState((s) => ({
        ...s,
        playerAnim: side === "player" ? (s.playerSuper ? "super-idle" : "idle") : s.playerAnim,
        enemyAnim: side === "enemy" ? (s.enemySuper ? "super-idle" : "idle") : s.enemyAnim,
        shakeScreen: false,
        hitFlashPlayer: false,
        hitFlashEnemy: false,
      }));
    }, 450);
  }, []);

  const clearParticles = useCallback(() => {
    if (particleTimer.current) clearTimeout(particleTimer.current);
    particleTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, particles: [] }));
    }, 700);
  }, []);

  const startFight = useCallback(() => {
    setState({ ...initialState, phase: "fighting" });
    logId.current = 0;
  }, []);

  const checkEnd = useCallback((pHP: number, eHP: number): FightPhase | null => {
    if (pHP <= 0 && eHP <= 0) return "draw";
    if (pHP <= 0) return "enemy_win";
    if (eHP <= 0) return "player_win";
    return null;
  }, []);

  const enemyAI = useCallback(() => {
    setState((s) => {
      if (s.phase !== "fighting") return s;

      const actions: ActionType[] = ["attack", "attack", "heavy", "block", "parry", "dodge"];
      const rnd = Math.random();
      let action: ActionType;

      if (!s.enemySuper && enemy.superForm && s.enemyEnergy >= 80 && rnd < 0.25) {
        action = "transform";
      } else if (s.enemyHP < 30 && s.enemyEnergy >= 40 && rnd < 0.35) {
        action = "special";
      } else if (s.isBlocking && rnd < 0.45) {
        action = "heavy";
      } else if (s.combo > 2 && rnd < 0.4) {
        action = "block";
      } else {
        action = actions[Math.floor(Math.random() * actions.length)];
      }

      if (action === "transform") {
        logId.current++;
        return {
          ...s,
          enemySuper: true,
          enemyEnergy: Math.max(0, s.enemyEnergy - 80),
          enemyAnim: "transform",
          transformCutscene: true,
          transformSide: "enemy",
          log: [{ id: logId.current, text: `💥 ${enemy.name}: ${enemy.superForm?.transformText || "ТРАНСФОРМАЦИЯ!"}`, type: "transform" }, ...s.log].slice(0, 6),
        };
      }

      let newPlayerHP = s.playerHP;
      let newEnemyEnergy = Math.min(100, s.enemyEnergy + 5);
      let logText = "";
      let logType: BattleLog["type"] = "enemy";
      let playerAnim: CharAnim = s.playerAnim;
      let enemyAnim: CharAnim = "idle";
      let shakeScreen = false;
      let hitFlashPlayer = false;
      let newParticles: Particle[] = [];

      if (action === "attack") {
        enemyAnim = "attack";
        if (s.isBlocking) {
          const blocked = Math.floor(calcDamage(enemy, 6, false, s.enemySuper) * 0.15);
          newPlayerHP = Math.max(0, s.playerHP - blocked);
          logText = `${enemy.name} атакует, но ${player.name} заблокировал! (-${blocked} HP)`;
          playerAnim = "block";
          newParticles = makeParticles("#3b82f6", 5);
        } else if (s.isParrying) {
          const counterDmg = calcDamage(player, 10, false, s.playerSuper);
          logId.current++;
          return {
            ...s, enemyHP: Math.max(0, s.enemyHP - counterDmg),
            playerAnim: "parry", enemyAnim: "hit",
            shakeScreen: true, hitFlashEnemy: true,
            particles: makeParticles(player.colorHex, 12, true),
            combo: s.combo + 1, maxCombo: Math.max(s.maxCombo, s.combo + 1),
            log: [{ id: logId.current, text: `⚡ ${player.name} ПАРИРОВАЛ и контратаковал! (-${counterDmg} HP)`, type: "special" }, ...s.log].slice(0, 6),
            phase: checkEnd(s.playerHP, Math.max(0, s.enemyHP - counterDmg)) || "fighting",
          };
        } else {
          const dmg = calcDamage(enemy, 6, false, s.enemySuper);
          newPlayerHP = Math.max(0, s.playerHP - dmg);
          logText = `${enemy.name} наносит удар! (-${dmg} HP)`;
          playerAnim = "hit";
          shakeScreen = true;
          hitFlashPlayer = true;
          newParticles = makeParticles(enemy.colorHex, 6);
        }
      } else if (action === "heavy") {
        enemyAnim = "heavy";
        const dmg = calcDamage(enemy, 12, true, s.enemySuper);
        if (s.isBlocking) {
          newPlayerHP = Math.max(0, s.playerHP - Math.floor(dmg * 0.7));
          logText = `${enemy.name} МОЩНЫЙ УДАР пробивает блок! (-${Math.floor(dmg * 0.7)} HP)`;
        } else {
          newPlayerHP = Math.max(0, s.playerHP - dmg);
          logText = `${enemy.name} СОКРУШИТЕЛЬНЫЙ УДАР! (-${dmg} HP)`;
        }
        playerAnim = "hit";
        shakeScreen = true;
        hitFlashPlayer = true;
        newParticles = makeParticles(enemy.colorHex, 10);
      } else if (action === "special") {
        enemyAnim = "special";
        const dmg = Math.round(enemy.power * (s.enemySuper ? 6 : 4) + 18);
        newPlayerHP = Math.max(0, s.playerHP - dmg);
        newEnemyEnergy = Math.max(0, s.enemyEnergy - 40);
        logText = `✨ ${enemy.name}: ${enemy.special}! (-${dmg} HP)`;
        logType = "special";
        playerAnim = "hit";
        shakeScreen = true;
        hitFlashPlayer = true;
        newParticles = makeParticles(enemy.colorHex, 20, true);
      } else if (action === "dodge") {
        enemyAnim = "dodge";
        newEnemyEnergy = Math.min(100, s.enemyEnergy + 15);
        logText = `${enemy.name} уходит в уклонение!`;
      } else {
        logText = `${enemy.name} принимает стойку защиты`;
      }

      logId.current++;
      const phase = checkEnd(newPlayerHP, s.enemyHP);
      return {
        ...s,
        playerHP: newPlayerHP,
        enemyEnergy: newEnemyEnergy,
        playerAnim,
        enemyAnim,
        shakeScreen,
        hitFlashPlayer,
        particles: newParticles,
        log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        phase: phase || "fighting",
        isBlocking: false,
        isParrying: false,
      };
    });
  }, [enemy, player, checkEnd]);

  const playerAction = useCallback((action: ActionType) => {
    if (enemyTimer.current) clearTimeout(enemyTimer.current);

    setState((s) => {
      if (s.phase !== "fighting") return s;

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

      if (action === "transform") {
        if (!player.superForm || s.playerSuper) return s;
        if (newSuperEnergy < 100) {
          logText = "Недостаточно SUPER ENERGY для трансформации!";
          logType = "system";
          logId.current++;
          return { ...s, log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6) };
        }
        logId.current++;
        return {
          ...s, playerSuper: true, playerSuperEnergy: 0,
          playerAnim: "transform", transformCutscene: true, transformSide: "player",
          log: [{ id: logId.current, text: `💥 ${player.name}: ${player.superForm.transformText}`, type: "transform" }, ...s.log].slice(0, 6),
        };
      }

      if (action === "attack") {
        const comboBonus = newCombo > 1 ? newCombo * 3 : 0;
        const dmg = calcDamage(player, 5, false, s.playerSuper) + comboBonus;
        newEnemyHP = Math.max(0, s.enemyHP - dmg);
        newCombo = s.combo + 1;
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 8);
        const comboStr = newCombo > 2 ? ` 🔥 КОМБО ×${newCombo}!` : "";
        logText = `${player.name} атакует${comboStr} (-${dmg} HP)`;
        playerAnim = newCombo > 3 ? "attack" : "attack";
        enemyAnim = "hit";
        shakeScreen = newCombo > 2;
        hitFlashEnemy = true;
        newParticles = makeParticles(player.colorHex, newCombo > 3 ? 12 : 6, newCombo > 4);
      } else if (action === "heavy") {
        if (newPlayerEnergy < 20) {
          logText = "Недостаточно энергии!";
          logType = "system";
          logId.current++;
          return { ...s, log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6) };
        }
        const dmg = calcDamage(player, 14, true, s.playerSuper);
        newEnemyHP = Math.max(0, s.enemyHP - dmg);
        newPlayerEnergy = Math.max(0, s.playerEnergy - 20);
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 15);
        newCombo = s.combo + 1;
        logText = `${player.name} МОЩНЫЙ УДАР! (-${dmg} HP)`;
        playerAnim = "heavy";
        enemyAnim = "hit";
        shakeScreen = true;
        hitFlashEnemy = true;
        newParticles = makeParticles(player.colorHex, 14, true);
      } else if (action === "special") {
        if (newPlayerEnergy < 40) {
          logText = "Недостаточно энергии для спецприёма!";
          logType = "system";
          logId.current++;
          return { ...s, log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6) };
        }
        const dmg = Math.round(player.power * (s.playerSuper ? 6 : 4) + 20);
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
        newParticles = makeParticles(player.colorHex, 24, true);
      } else if (action === "block") {
        newCombo = 0;
        logText = `${player.name} принимает стойку блока`;
        logType = "system";
        playerAnim = "block";
        return {
          ...s, isBlocking: true, isParrying: false,
          combo: 0, playerAnim,
          log: [{ id: ++logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        };
      } else if (action === "parry") {
        newCombo = 0;
        logText = `${player.name} готов к парированию! ⚡`;
        logType = "system";
        playerAnim = "parry";
        return {
          ...s, isParrying: true, isBlocking: false,
          combo: 0, playerAnim,
          log: [{ id: ++logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        };
      } else if (action === "dodge") {
        newCombo = 0;
        newPlayerEnergy = Math.min(100, s.playerEnergy + 18);
        newSuperEnergy = Math.min(100, s.playerSuperEnergy + 5);
        logText = `${player.name} уклоняется! (+18 энергии)`;
        logType = "system";
        playerAnim = "dodge";
        return {
          ...s, playerEnergy: newPlayerEnergy, playerSuperEnergy: newSuperEnergy,
          combo: 0, playerAnim,
          log: [{ id: ++logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        };
      }

      logId.current++;
      const phase = checkEnd(newPlayerHP, newEnemyHP);
      return {
        ...s,
        enemyHP: newEnemyHP,
        playerHP: newPlayerHP,
        playerEnergy: newPlayerEnergy,
        playerSuperEnergy: newSuperEnergy,
        combo: newCombo,
        maxCombo: Math.max(s.maxCombo, newCombo),
        log: [{ id: logId.current, text: logText, type: logType }, ...s.log].slice(0, 6),
        phase: phase || "fighting",
        playerAnim,
        enemyAnim,
        shakeScreen,
        hitFlashEnemy,
        hitFlashPlayer: false,
        particles: newParticles,
        isBlocking: false,
        isParrying: false,
        lastAction: action,
      };
    });

    resetAnim("player");
    clearParticles();

    enemyTimer.current = setTimeout(() => {
      enemyAI();
      resetAnim("enemy");
      clearParticles();
    }, ENEMY_THINK_DELAY);
  }, [player, checkEnd, enemyAI, resetAnim, clearParticles]);

  const restoreEnergy = useCallback(() => {
    setState((s) => {
      if (s.phase !== "fighting") return s;
      return {
        ...s,
        playerEnergy: Math.min(100, s.playerEnergy + 8),
        enemyEnergy: Math.min(100, s.enemyEnergy + 6),
      };
    });
  }, []);

  const dismissTransform = useCallback(() => {
    setState((s) => ({ ...s, transformCutscene: false, transformSide: null }));
  }, []);

  useEffect(() => {
    return () => {
      if (enemyTimer.current) clearTimeout(enemyTimer.current);
      if (animTimer.current) clearTimeout(animTimer.current);
      if (particleTimer.current) clearTimeout(particleTimer.current);
    };
  }, []);

  return { state, startFight, playerAction, restoreEnergy, dismissTransform };
}
