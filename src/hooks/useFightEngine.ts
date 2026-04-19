import { useState, useCallback, useEffect, useRef } from "react";
import { Character } from "@/data/characters";

export type FightPhase = "idle" | "fighting" | "player_win" | "enemy_win" | "draw";
export type ActionType = "attack" | "heavy" | "block" | "parry" | "special" | "dodge";

export interface BattleLog {
  id: number;
  text: string;
  type: "player" | "enemy" | "system" | "special";
}

interface FightState {
  playerHP: number;
  enemyHP: number;
  playerMaxHP: number;
  enemyMaxHP: number;
  playerEnergy: number;
  enemyEnergy: number;
  phase: FightPhase;
  log: BattleLog[];
  combo: number;
  isBlocking: boolean;
  isParrying: boolean;
  lastAction: ActionType | null;
  shake: "player" | "enemy" | null;
  flashPlayer: boolean;
  flashEnemy: boolean;
  roundNumber: number;
}

const calcDamage = (attacker: Character, base: number, isHeavy: boolean) => {
  const multiplier = isHeavy ? 1.6 : 1;
  return Math.round((base + attacker.power * 1.5) * multiplier);
};

const ENEMY_THINK_DELAY = 900;

export function useFightEngine(player: Character, enemy: Character) {
  const maxHP = 100;
  const logId = useRef(0);
  const enemyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<FightState>({
    playerHP: maxHP,
    enemyHP: maxHP,
    playerMaxHP: maxHP,
    enemyMaxHP: maxHP,
    playerEnergy: 100,
    enemyEnergy: 100,
    phase: "idle",
    log: [],
    combo: 0,
    isBlocking: false,
    isParrying: false,
    lastAction: null,
    shake: null,
    flashPlayer: false,
    flashEnemy: false,
    roundNumber: 1,
  });

  const addLog = useCallback(
    (text: string, type: BattleLog["type"] = "system") => {
      logId.current += 1;
      const entry: BattleLog = { id: logId.current, text, type };
      setState((s) => ({ ...s, log: [entry, ...s.log].slice(0, 6) }));
    },
    []
  );

  const startFight = useCallback(() => {
    setState({
      playerHP: maxHP,
      enemyHP: maxHP,
      playerMaxHP: maxHP,
      enemyMaxHP: maxHP,
      playerEnergy: 100,
      enemyEnergy: 100,
      phase: "fighting",
      log: [],
      combo: 0,
      isBlocking: false,
      isParrying: false,
      lastAction: null,
      shake: null,
      flashPlayer: false,
      flashEnemy: false,
      roundNumber: 1,
    });
    logId.current = 0;
  }, []);

  const checkEnd = useCallback(
    (pHP: number, eHP: number): FightPhase | null => {
      if (pHP <= 0 && eHP <= 0) return "draw";
      if (pHP <= 0) return "enemy_win";
      if (eHP <= 0) return "player_win";
      return null;
    },
    []
  );

  const enemyAI = useCallback(
    (
      currentPlayerHP: number,
      currentEnemyHP: number,
      isPlayerBlocking: boolean,
      combo: number
    ) => {
      const actions: ActionType[] = ["attack", "attack", "heavy", "block", "parry", "dodge"];
      const rnd = Math.random();

      let action: ActionType;
      if (currentEnemyHP < 30 && rnd < 0.3) {
        action = "special";
      } else if (isPlayerBlocking && rnd < 0.5) {
        action = "heavy";
      } else if (combo > 2 && rnd < 0.4) {
        action = "block";
      } else {
        action = actions[Math.floor(Math.random() * actions.length)];
      }

      setState((s) => {
        if (s.phase !== "fighting") return s;

        let newPlayerHP = s.playerHP;
        let newEnemyEnergy = s.enemyEnergy;
        let logText = "";
        let logType: BattleLog["type"] = "enemy";
        let shake: "player" | "enemy" | null = null;
        let flashPlayer = false;

        if (action === "attack") {
          if (s.isBlocking) {
            const blocked = Math.floor(calcDamage(enemy, 6, false) * 0.2);
            newPlayerHP = Math.max(0, s.playerHP - blocked);
            logText = `${enemy.name} атакует, но ${player.name} заблокировал! (-${blocked} HP)`;
            shake = "player";
          } else if (s.isParrying) {
            const counterDmg = calcDamage(player, 8, false);
            logText = `${player.name} ПАРИРОВАЛ удар и контратаковал! (${enemy.name} -${counterDmg} HP)`;
            logType = "special";
            return handleCounterParry(s, counterDmg);
          } else {
            const dmg = calcDamage(enemy, 6, false);
            newPlayerHP = Math.max(0, s.playerHP - dmg);
            logText = `${enemy.name} наносит удар! (-${dmg} HP)`;
            shake = "player";
            flashPlayer = true;
          }
        } else if (action === "heavy") {
          if (s.isBlocking) {
            const dmg = calcDamage(enemy, 12, true);
            newPlayerHP = Math.max(0, s.playerHP - dmg);
            logText = `${enemy.name} МОЩНЫЙ УДАР пробивает блок! (-${dmg} HP)`;
            shake = "player";
            flashPlayer = true;
          } else if (s.isParrying) {
            logText = `${player.name} пытался парировать, но удар слишком силён!`;
            const dmg = Math.floor(calcDamage(enemy, 12, true) * 0.5);
            newPlayerHP = Math.max(0, s.playerHP - dmg);
            shake = "player";
            flashPlayer = true;
          } else {
            const dmg = calcDamage(enemy, 12, true);
            newPlayerHP = Math.max(0, s.playerHP - dmg);
            logText = `${enemy.name} СОКРУШИТЕЛЬНЫЙ УДАР! (-${dmg} HP)`;
            shake = "player";
            flashPlayer = true;
          }
        } else if (action === "special") {
          const dmg = Math.round(enemy.power * 4 + 15);
          newPlayerHP = Math.max(0, s.playerHP - dmg);
          newEnemyEnergy = Math.max(0, s.enemyEnergy - 30);
          logText = `✨ ${enemy.name}: ${enemy.special}! (-${dmg} HP)`;
          logType = "special";
          shake = "player";
          flashPlayer = true;
        } else if (action === "dodge") {
          logText = `${enemy.name} уходит в уклонение!`;
          logType = "enemy";
        } else {
          logText = `${enemy.name} принимает стойку защиты`;
          logType = "enemy";
        }

        logId.current += 1;
        const entry: BattleLog = { id: logId.current, text: logText, type: logType };
        const newLog = [entry, ...s.log].slice(0, 6);
        const phase = checkEnd(newPlayerHP, s.enemyHP);

        return {
          ...s,
          playerHP: newPlayerHP,
          enemyEnergy: newEnemyEnergy,
          log: newLog,
          phase: phase || "fighting",
          shake,
          flashPlayer,
          isBlocking: false,
          isParrying: false,
        };
      });
    },
    [enemy, player, checkEnd]
  );

  function handleCounterParry(s: FightState, counterDmg: number): FightState {
    const newEnemyHP = Math.max(0, s.enemyHP - counterDmg);
    logId.current += 1;
    const entry: BattleLog = {
      id: logId.current,
      text: `${player.name} ПАРИРОВАЛ удар и контратаковал! (-${counterDmg} HP)`,
      type: "special",
    };
    const phase = checkEnd(s.playerHP, newEnemyHP);
    return {
      ...s,
      enemyHP: newEnemyHP,
      log: [entry, ...s.log].slice(0, 6),
      phase: phase || "fighting",
      shake: "enemy",
      flashEnemy: true,
      isBlocking: false,
      isParrying: false,
      combo: s.combo + 1,
    };
  }

  const playerAction = useCallback(
    (action: ActionType) => {
      if (enemyTimer.current) clearTimeout(enemyTimer.current);

      setState((s) => {
        if (s.phase !== "fighting") return s;

        let newEnemyHP = s.enemyHP;
        const newPlayerHP = s.playerHP;
        let newPlayerEnergy = s.playerEnergy;
        let newCombo = s.combo;
        let logText = "";
        let logType: BattleLog["type"] = "player";
        let isBlocking = false;
        let isParrying = false;
        let shake: "player" | "enemy" | null = null;
        let flashEnemy = false;

        if (action === "attack") {
          const dmg = calcDamage(player, 5, false) + (newCombo > 1 ? newCombo * 2 : 0);
          newEnemyHP = Math.max(0, s.enemyHP - dmg);
          newCombo = s.combo + 1;
          const comboStr = newCombo > 2 ? ` (КОМБО x${newCombo}!)` : "";
          logText = `${player.name} атакует${comboStr}! (-${dmg} HP)`;
          shake = "enemy";
          flashEnemy = true;
        } else if (action === "heavy") {
          if (newPlayerEnergy < 20) {
            logText = "Недостаточно энергии для мощного удара!";
            logType = "system";
          } else {
            const dmg = calcDamage(player, 12, true);
            newEnemyHP = Math.max(0, s.enemyHP - dmg);
            newPlayerEnergy = Math.max(0, s.playerEnergy - 20);
            newCombo = s.combo + 1;
            logText = `${player.name} МОЩНЫЙ УДАР! (-${dmg} HP)`;
            shake = "enemy";
            flashEnemy = true;
          }
        } else if (action === "special") {
          if (newPlayerEnergy < 40) {
            logText = "Недостаточно энергии для спецприёма!";
            logType = "system";
          } else {
            const dmg = Math.round(player.power * 4 + 18);
            newEnemyHP = Math.max(0, s.enemyHP - dmg);
            newPlayerEnergy = Math.max(0, s.playerEnergy - 40);
            newCombo = 0;
            logText = `✨ ${player.special}! (-${dmg} HP)`;
            logType = "special";
            shake = "enemy";
            flashEnemy = true;
          }
        } else if (action === "block") {
          isBlocking = true;
          newCombo = 0;
          logText = `${player.name} принимает стойку блока`;
        } else if (action === "parry") {
          isParrying = true;
          newCombo = 0;
          logText = `${player.name} готов к парированию!`;
          logType = "system";
        } else if (action === "dodge") {
          newCombo = 0;
          newPlayerEnergy = Math.min(100, s.playerEnergy + 15);
          logText = `${player.name} уклоняется и восстанавливает энергию (+15)`;
          logType = "system";
        }

        logId.current += 1;
        const entry: BattleLog = { id: logId.current, text: logText, type: logType };
        const newLog = [entry, ...s.log].slice(0, 6);
        const phase = checkEnd(newPlayerHP, newEnemyHP);

        const newState: FightState = {
          ...s,
          enemyHP: newEnemyHP,
          playerHP: newPlayerHP,
          playerEnergy: newPlayerEnergy,
          combo: newCombo,
          log: newLog,
          phase: phase || "fighting",
          isBlocking,
          isParrying,
          shake,
          flashEnemy,
          flashPlayer: false,
          lastAction: action,
        };

        return newState;
      });

      if (action !== "special" || state.playerEnergy >= 40) {
        enemyTimer.current = setTimeout(() => {
          setState((s) => {
            enemyAI(s.playerHP, s.enemyHP, s.isBlocking, s.combo);
            return s;
          });
        }, ENEMY_THINK_DELAY);
      }
    },
    [player, checkEnd, enemyAI, state.playerEnergy]
  );

  useEffect(() => {
    setState((s) => {
      if (s.shake) {
        const timer = setTimeout(() => {
          setState((prev) => ({ ...prev, shake: null, flashPlayer: false, flashEnemy: false }));
        }, 400);
        return s;
      }
      return s;
    });
  }, [state.shake]);

  useEffect(() => {
    return () => {
      if (enemyTimer.current) clearTimeout(enemyTimer.current);
    };
  }, []);

  const restoreEnergy = useCallback(() => {
    setState((s) => ({
      ...s,
      playerEnergy: Math.min(100, s.playerEnergy + 10),
      enemyEnergy: Math.min(100, s.enemyEnergy + 8),
    }));
  }, []);

  return { state, startFight, playerAction, restoreEnergy };
}
