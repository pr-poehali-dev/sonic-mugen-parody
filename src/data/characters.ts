export interface SuperForm {
  name: string;
  emoji: string;
  colorHex: string;
  bgGlow: string;
  powerBoost: number;
  speedBoost: number;
  aura: string;
  transformText: string;
}

export interface Character {
  id: string;
  name: string;
  emoji: string;
  color: string;
  colorHex: string;
  bgGradient: string;
  speed: number;
  power: number;
  defense: number;
  description: string;
  style: string;
  combos: string[];
  special: string;
  specialKey: string;
  superForm?: SuperForm;
  idleAnim: string;
  attackAnim: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "sonic",
    name: "Соник",
    emoji: "💙",
    color: "text-blue-400",
    colorHex: "#60a5fa",
    bgGradient: "from-blue-900 to-blue-600",
    speed: 10,
    power: 6,
    defense: 5,
    description: "Быстрее звука",
    style: "Молниеносные комбо",
    combos: ["Spin Dash", "Homing Attack", "Blue Tornado"],
    special: "SUPER SONIC RUSH",
    specialKey: "↓↓A",
    idleAnim: "sonic-idle",
    attackAnim: "sonic-attack",
    superForm: {
      name: "SUPER SONIC",
      emoji: "⭐",
      colorHex: "#fbbf24",
      bgGlow: "#fbbf24",
      powerBoost: 2.5,
      speedBoost: 3,
      aura: "golden",
      transformText: "SONIC GOES SUPER!",
    },
  },
  {
    id: "shadow",
    name: "Шэдоу",
    emoji: "🖤",
    color: "text-red-400",
    colorHex: "#f87171",
    bgGradient: "from-gray-900 to-red-900",
    speed: 9,
    power: 8,
    defense: 6,
    description: "Абсолютная сила",
    style: "Агрессивный напор",
    combos: ["Chaos Spear", "Black Tornado", "Chaos Blast"],
    special: "CHAOS CONTROL",
    specialKey: "↓↑B",
    idleAnim: "shadow-idle",
    attackAnim: "shadow-attack",
    superForm: {
      name: "SUPER SHADOW",
      emoji: "💀",
      colorHex: "#dc2626",
      bgGlow: "#7f1d1d",
      powerBoost: 2.8,
      speedBoost: 2.5,
      aura: "dark-red",
      transformText: "CHAOS AWAKENED!",
    },
  },
  {
    id: "knuckles",
    name: "Наклз",
    emoji: "❤️",
    color: "text-red-500",
    colorHex: "#ef4444",
    bgGradient: "from-red-900 to-orange-700",
    speed: 5,
    power: 10,
    defense: 8,
    description: "Сила земли",
    style: "Мощные удары",
    combos: ["Drill Claw", "Thunder Arrow", "Quake Punch"],
    special: "MAXIMUM HEAT",
    specialKey: "→→A",
    idleAnim: "knuckles-idle",
    attackAnim: "knuckles-attack",
    superForm: {
      name: "HYPER KNUCKLES",
      emoji: "🔥",
      colorHex: "#f97316",
      bgGlow: "#ea580c",
      powerBoost: 3.5,
      speedBoost: 1.5,
      aura: "fire",
      transformText: "EARTH SHAKER!",
    },
  },
  {
    id: "tails",
    name: "Тейлз",
    emoji: "💛",
    color: "text-yellow-400",
    colorHex: "#facc15",
    bgGradient: "from-yellow-900 to-orange-600",
    speed: 7,
    power: 5,
    defense: 7,
    description: "Гений механики",
    style: "Дальний бой",
    combos: ["Tail Swipe", "Dummy Ring", "Energy Ball"],
    special: "MECH STORM",
    specialKey: "↑↑B",
    idleAnim: "tails-idle",
    attackAnim: "tails-attack",
    superForm: {
      name: "SUPER TAILS",
      emoji: "⚡",
      colorHex: "#fde68a",
      bgGlow: "#d97706",
      powerBoost: 2.2,
      speedBoost: 2.8,
      aura: "electric",
      transformText: "SUPER FLIGHT MODE!",
    },
  },
  {
    id: "amy",
    name: "Эми",
    emoji: "🩷",
    color: "text-pink-400",
    colorHex: "#f472b6",
    bgGradient: "from-pink-900 to-rose-600",
    speed: 6,
    power: 7,
    defense: 6,
    description: "Молот справедливости",
    style: "Контратаки",
    combos: ["Hammer Swing", "Rose Typhoon", "Love Spark"],
    special: "PIKO PIKO CRUSH",
    specialKey: "←←A",
    idleAnim: "amy-idle",
    attackAnim: "amy-attack",
    superForm: {
      name: "FURY AMY",
      emoji: "💖",
      colorHex: "#fb7185",
      bgGlow: "#e11d48",
      powerBoost: 3.2,
      speedBoost: 2,
      aura: "rose",
      transformText: "LOVE IS FURY!",
    },
  },
  {
    id: "silver",
    name: "Сильвер",
    emoji: "🤍",
    color: "text-slate-300",
    colorHex: "#cbd5e1",
    bgGradient: "from-slate-700 to-cyan-800",
    speed: 6,
    power: 7,
    defense: 8,
    description: "Телекинез будущего",
    style: "Контроль поля",
    combos: ["Psycho Shock", "Telekinesis", "ESP Blast"],
    special: "IT'S NO USE!",
    specialKey: "↑→B",
    idleAnim: "silver-idle",
    attackAnim: "silver-attack",
    superForm: {
      name: "SUPER SILVER",
      emoji: "🌟",
      colorHex: "#e2e8f0",
      bgGlow: "#94a3b8",
      powerBoost: 2.6,
      speedBoost: 2.4,
      aura: "psychic",
      transformText: "MIND OVER MATTER!",
    },
  },
  {
    id: "blaze",
    name: "Блэйз",
    emoji: "💜",
    color: "text-purple-400",
    colorHex: "#c084fc",
    bgGradient: "from-purple-900 to-pink-800",
    speed: 8,
    power: 8,
    defense: 5,
    description: "Принцесса огня",
    style: "Огненные атаки",
    combos: ["Fire Claw", "Flame Wave", "Sol Inferno"],
    special: "BURNING BLAZE",
    specialKey: "↓←A",
    idleAnim: "blaze-idle",
    attackAnim: "blaze-attack",
    superForm: {
      name: "BURNING BLAZE",
      emoji: "🔥",
      colorHex: "#fb923c",
      bgGlow: "#c2410c",
      powerBoost: 3,
      speedBoost: 2.5,
      aura: "inferno",
      transformText: "SOL EMERALDS AWAKEN!",
    },
  },
  {
    id: "rouge",
    name: "Руж",
    emoji: "🦋",
    color: "text-fuchsia-400",
    colorHex: "#e879f9",
    bgGradient: "from-fuchsia-900 to-violet-800",
    speed: 7,
    power: 6,
    defense: 7,
    description: "Летучая мышь-шпион",
    style: "Воздушный бой",
    combos: ["Screw Kick", "Bat Blade", "Shadow Drill"],
    special: "JEWEL STORM",
    specialKey: "↑←B",
    idleAnim: "rouge-idle",
    attackAnim: "rouge-attack",
    superForm: {
      name: "CHAOS ROUGE",
      emoji: "💎",
      colorHex: "#a855f7",
      bgGlow: "#7e22ce",
      powerBoost: 2.4,
      speedBoost: 3,
      aura: "crystal",
      transformText: "JEWEL AWAKENING!",
    },
  },
];

export const getCharacterById = (id: string) =>
  CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
