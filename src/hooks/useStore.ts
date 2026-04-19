import { useState, useCallback } from "react";
import { CHARACTERS } from "@/data/characters";

export type ChestType = "basic" | "rare" | "epic" | "dark_prism";

export interface ChestConfig {
  id: ChestType;
  name: string;
  emoji: string;
  description: string;
  priceRings: number;
  priceGems: number;
  color: string;
  glow: string;
  rarityWeights: Record<string, number>; // rarity -> weight
}

export const CHESTS: ChestConfig[] = [
  {
    id: "basic",
    name: "Обычный сундук",
    emoji: "📦",
    description: "Шанс получить обычного или редкого бойца",
    priceRings: 500,
    priceGems: 0,
    color: "#94a3b8",
    glow: "#94a3b822",
    rarityWeights: { common: 60, rare: 30, epic: 9, legendary: 1, mythic: 0 },
  },
  {
    id: "rare",
    name: "Редкий сундук",
    emoji: "💠",
    description: "Гарантирован редкий или лучше",
    priceRings: 1200,
    priceGems: 15,
    color: "#60a5fa",
    glow: "#60a5fa33",
    rarityWeights: { common: 0, rare: 50, epic: 35, legendary: 14, mythic: 1 },
  },
  {
    id: "epic",
    name: "Эпический сундук",
    emoji: "💜",
    description: "Гарантирован эпический или выше",
    priceRings: 2500,
    priceGems: 30,
    color: "#a78bfa",
    glow: "#a78bfa33",
    rarityWeights: { common: 0, rare: 0, epic: 60, legendary: 35, mythic: 5 },
  },
  {
    id: "dark_prism",
    name: "Тёмная Призма",
    emoji: "🌑",
    description: "Только мифические и легендарные. Шанс Dark Sonic!",
    priceRings: 0,
    priceGems: 80,
    color: "#8b5cf6",
    glow: "#8b5cf633",
    rarityWeights: { common: 0, rare: 0, epic: 0, legendary: 60, mythic: 40 },
  },
];

export interface StoreState {
  rings: number;
  gems: number;
  ownedCharacterIds: string[];
  lastChestResult: { characterId: string; isNew: boolean } | null;
}

const SAVE_KEY = "sonic_fighters_store";

function loadStore(): StoreState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as StoreState;
  } catch (e) { void e; }
  return {
    rings: 1000,
    gems: 10,
    ownedCharacterIds: ["sonic"],
    lastChestResult: null,
  };
}

function saveStore(state: StoreState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) { void e; }
}

function rollChest(chest: ChestConfig): string {
  const weights = chest.rarityWeights;
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let targetRarity = "common";
  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) { targetRarity = rarity; break; }
  }

  const candidates = CHARACTERS.filter(c => c.rarity === targetRarity && c.price > 0);
  if (!candidates.length) {
    // fallback
    const fallback = CHARACTERS.filter(c => c.price > 0);
    return fallback[Math.floor(Math.random() * fallback.length)].id;
  }
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

export function useStore() {
  const [store, setStore] = useState<StoreState>(loadStore);

  const update = useCallback((updater: (s: StoreState) => StoreState) => {
    setStore(prev => {
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const buyCharacter = useCallback((charId: string): "ok" | "already" | "no_rings" | "no_gems" => {
    const char = CHARACTERS.find(c => c.id === charId);
    if (!char) return "no_rings";

    let result: "ok" | "already" | "no_rings" | "no_gems" = "ok";
    setStore(prev => {
      if (prev.ownedCharacterIds.includes(charId)) { result = "already"; return prev; }
      if (char.priceGems > 0 && prev.gems >= char.priceGems) {
        const next = { ...prev, gems: prev.gems - char.priceGems, ownedCharacterIds: [...prev.ownedCharacterIds, charId] };
        saveStore(next); return next;
      }
      if (char.price > 0 && prev.rings >= char.price) {
        const next = { ...prev, rings: prev.rings - char.price, ownedCharacterIds: [...prev.ownedCharacterIds, charId] };
        saveStore(next); return next;
      }
      if (char.priceGems > 0 && prev.gems < char.priceGems) { result = "no_gems"; return prev; }
      result = "no_rings";
      return prev;
    });
    return result;
  }, []);

  const openChest = useCallback((chestId: ChestType): "ok" | "no_rings" | "no_gems" => {
    const chest = CHESTS.find(c => c.id === chestId);
    if (!chest) return "no_rings";

    let result: "ok" | "no_rings" | "no_gems" = "ok";
    setStore(prev => {
      if (chest.priceGems > 0) {
        if (prev.gems < chest.priceGems) { result = "no_gems"; return prev; }
      } else {
        if (prev.rings < chest.priceRings) { result = "no_rings"; return prev; }
      }

      const charId = rollChest(chest);
      const isNew = !prev.ownedCharacterIds.includes(charId);

      // Ring bonus if duplicate
      const dupeRings = isNew ? 0 : 150;

      const next: StoreState = {
        ...prev,
        rings: chest.priceGems > 0
          ? prev.rings + dupeRings
          : prev.rings - chest.priceRings + dupeRings,
        gems: chest.priceGems > 0 ? prev.gems - chest.priceGems : prev.gems,
        ownedCharacterIds: isNew ? [...prev.ownedCharacterIds, charId] : prev.ownedCharacterIds,
        lastChestResult: { characterId: charId, isNew },
      };
      saveStore(next);
      return next;
    });
    return result;
  }, []);

  const addRings = useCallback((amount: number) => {
    update(s => ({ ...s, rings: s.rings + amount }));
  }, [update]);

  const clearChestResult = useCallback(() => {
    update(s => ({ ...s, lastChestResult: null }));
  }, [update]);

  const isOwned = useCallback((charId: string) =>
    store.ownedCharacterIds.includes(charId) || CHARACTERS.find(c => c.id === charId)?.unlocked === true,
    [store.ownedCharacterIds]);

  return { store, buyCharacter, openChest, addRings, clearChestResult, isOwned };
}