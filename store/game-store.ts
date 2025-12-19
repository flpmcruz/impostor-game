/**
 * Game store - manages all game state and logic
 * Uses crypto-secure randomness for fair gameplay
 * Includes resilient storage with automatic recovery
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Storage keys
const STORAGE_KEY = 'impostor_game_v1';
const CUSTOM_CATEGORIES_KEY = 'impostor_custom_categories_v1';

// ============ RESILIENT STORAGE UTILITIES ============

const STORAGE_TIMEOUT = 5000; // 5 seconds max for any storage operation

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Safely parse JSON with validation
 */
function safeJsonParse<T>(json: string | null, validator?: (data: unknown) => data is T): T | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    if (validator && !validator(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Safe storage read with timeout and error recovery
 */
async function safeStorageGet(key: string): Promise<string | null> {
  try {
    return await withTimeout(
      AsyncStorage.getItem(key),
      STORAGE_TIMEOUT,
      null
    );
  } catch {
    return null;
  }
}

/**
 * Safe storage write with timeout and error recovery
 */
async function safeStorageSet(key: string, value: string): Promise<boolean> {
  try {
    await withTimeout(
      AsyncStorage.setItem(key, value),
      STORAGE_TIMEOUT,
      undefined
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe storage remove with timeout
 */
async function safeStorageRemove(key: string): Promise<boolean> {
  try {
    await withTimeout(
      AsyncStorage.removeItem(key),
      STORAGE_TIMEOUT,
      undefined
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear potentially corrupted data
 */
export async function clearCorruptedData(): Promise<void> {
  await safeStorageRemove(STORAGE_KEY);
  await safeStorageRemove(CUSTOM_CATEGORIES_KEY);
}

// Category type definition
export interface Category {
  emoji: string;
  name: string;
  words: string[];
  isCustom?: boolean;
}

export type Categories = Record<string, Category>;

// Default categories with expanded word lists
export const DEFAULT_CATEGORIES: Categories = {
  mixta: {
    emoji: '🎲',
    name: 'Mixta',
    words: [], // Will be populated dynamically
  },
  lugares: {
    emoji: '📍',
    name: 'Lugares',
    words: [
      'Playa', 'Submarino', 'Escuela', 'Circo', 'Banco', 'Avión', 'Hospital',
      'Base Militar', 'Supermercado', 'Hotel', 'Restaurante', 'Aeropuerto',
      'Parque', 'Castillo', 'Museo', 'Cárcel', 'Estadio', 'Biblioteca',
      'Cine', 'Teatro', 'Gimnasio', 'Iglesia', 'Cementerio', 'Zoológico',
      'Acuario', 'Casino', 'Discoteca', 'Spa', 'Oficina', 'Fábrica',
    ],
  },
  comida: {
    emoji: '🍕',
    name: 'Comida',
    words: [
      'Hamburguesa', 'Sushi', 'Pizza', 'Tacos', 'Helado', 'Ensalada',
      'Pastas', 'Sopa', 'Empanada', 'Hot Dog', 'Arroz', 'Pollo',
      'Pan', 'Queso', 'Pastel', 'Galletas', 'Chocolate', 'Cereal',
      'Nachos', 'Burrito', 'Paella', 'Ceviche', 'Ramen', 'Curry',
      'Fondue', 'Croissant', 'Waffles', 'Pancakes', 'Donas', 'Churros',
    ],
  },
  animales: {
    emoji: '🦁',
    name: 'Animales',
    words: [
      'Perro', 'Gato', 'Elefante', 'Tiburón', 'Águila', 'Serpiente',
      'Pingüino', 'León', 'Tigre', 'Mono', 'Delfín', 'Ballena',
      'Caballo', 'Oso', 'Zorro', 'Lobo', 'Canguro', 'Koala',
      'Jirafa', 'Rinoceronte', 'Hipopótamo', 'Cocodrilo', 'Tortuga', 'Pulpo',
      'Cangrejo', 'Mariposa', 'Abeja', 'Araña', 'Murciélago', 'Búho',
    ],
  },
  profesiones: {
    emoji: '👨‍⚕️',
    name: 'Profesiones',
    words: [
      'Doctor', 'Maestro', 'Policía', 'Bombero', 'Chef', 'Piloto',
      'Ingeniero', 'Abogado', 'Arquitecto', 'Enfermero', 'Dentista',
      'Programador', 'Mecánico', 'Electricista', 'Veterinario', 'Psicólogo',
      'Periodista', 'Fotógrafo', 'Músico', 'Actor', 'Director', 'Escritor',
      'Científico', 'Astronauta', 'Atleta', 'Granjero', 'Pescador', 'Panadero',
    ],
  },
  objetos: {
    emoji: '📱',
    name: 'Objetos',
    words: [
      'Teléfono', 'Computadora', 'Llave', 'Mochila', 'Reloj', 'Lápiz',
      'Cuaderno', 'Silla', 'Mesa', 'Televisor', 'Cámara', 'Botella',
      'Audífonos', 'Linterna', 'Paraguas', 'Espejo', 'Tijeras', 'Martillo',
      'Cuchillo', 'Tenedor', 'Cuchara', 'Plato', 'Vaso', 'Taza',
      'Almohada', 'Cobija', 'Toalla', 'Jabón', 'Cepillo', 'Peine',
    ],
  },
  transporte: {
    emoji: '🚗',
    name: 'Transporte',
    words: [
      'Carro', 'Moto', 'Bicicleta', 'Avión', 'Barco', 'Submarino',
      'Tren', 'Metro', 'Autobús', 'Camión', 'Helicóptero', 'Patineta',
      'Taxi', 'Ambulancia', 'Camioneta', 'Limusina', 'Yate', 'Canoa',
      'Globo Aerostático', 'Cohete', 'Teleférico', 'Trineo', 'Patines', 'Scooter',
    ],
  },
  emociones: {
    emoji: '😊',
    name: 'Emociones',
    words: [
      'Felicidad', 'Tristeza', 'Enojo', 'Miedo', 'Sorpresa', 'Nervios',
      'Vergüenza', 'Orgullo', 'Celos', 'Ansiedad', 'Calma', 'Emoción',
      'Amor', 'Odio', 'Confusión', 'Aburrimiento', 'Esperanza', 'Nostalgia',
      'Gratitud', 'Envidia', 'Frustración', 'Satisfacción', 'Melancolía', 'Euforia',
    ],
  },
  acciones: {
    emoji: '🏃',
    name: 'Acciones',
    words: [
      'Correr', 'Saltar', 'Dormir', 'Comer', 'Nadar', 'Cantar',
      'Bailar', 'Leer', 'Escribir', 'Gritar', 'Pensar', 'Reír',
      'Llorar', 'Cocinar', 'Pintar', 'Dibujar', 'Fotografiar', 'Conducir',
      'Volar', 'Escalar', 'Bucear', 'Esquiar', 'Patinar', 'Surfear',
      'Meditar', 'Rezar', 'Aplaudir', 'Silbar', 'Bostezar', 'Estornudar',
    ],
  },
  peliculas: {
    emoji: '🎬',
    name: 'Películas',
    words: [
      'Titanic', 'Avatar', 'Matrix', 'Inception', 'Gladiador', 'Forrest Gump',
      'El Padrino', 'Jurassic Park', 'Toy Story', 'Frozen', 'Coco', 'Shrek',
      'Harry Potter', 'Star Wars', 'El Rey León', 'Avengers', 'Batman', 'Superman',
      'Spiderman', 'Iron Man', 'Terminator', 'Rocky', 'Karate Kid', 'ET',
    ],
  },
  deportes: {
    emoji: '⚽',
    name: 'Deportes',
    words: [
      'Fútbol', 'Básquetbol', 'Tenis', 'Béisbol', 'Golf', 'Natación',
      'Boxeo', 'Karate', 'Judo', 'Ciclismo', 'Atletismo', 'Gimnasia',
      'Voleibol', 'Rugby', 'Hockey', 'Esquí', 'Snowboard', 'Surf',
      'Escalada', 'Paracaidismo', 'Buceo', 'Polo', 'Esgrima', 'Arquería',
    ],
  },
  musica: {
    emoji: '🎵',
    name: 'Música',
    words: [
      'Guitarra', 'Piano', 'Batería', 'Violín', 'Trompeta', 'Saxofón',
      'Flauta', 'Acordeón', 'Arpa', 'Rock', 'Pop', 'Jazz',
      'Salsa', 'Reggaeton', 'Hip Hop', 'Clásica', 'Electrónica', 'Country',
      'Blues', 'Metal', 'Punk', 'Ópera', 'Mariachi', 'Cumbia',
    ],
  },
};

// In-memory categories (loaded from storage or defaults)
let CATEGORIES: Categories = { ...DEFAULT_CATEGORIES };

/**
 * Get all words from non-mixed categories
 */
function getAllWords(categories: Categories): string[] {
  return Object.entries(categories)
    .filter(([key]) => key !== 'mixta')
    .flatMap(([, category]) => category.words);
}

/**
 * Update the mixed category with all words
 */
function updateMixedCategory(categories: Categories): Categories {
  return {
    ...categories,
    mixta: {
      ...categories.mixta,
      words: getAllWords(categories),
    },
  };
}

// Initialize mixed category
CATEGORIES = updateMixedCategory(CATEGORIES);

export type CategoryKey = string;

export type GameScreen = 'setup' | 'pass' | 'reveal' | 'playing' | 'end';

export interface GameState {
  // Setup state
  players: string[];
  selectedCategory: CategoryKey;

  // Game state
  shuffledPlayers: string[];
  currentPlayerIndex: number;
  impostorIndex: number;
  secretWord: string;
  starterPlayer: string;

  // UI state
  currentScreen: GameScreen;
}

/**
 * Generate cryptographically secure random number with fallback
 */
async function secureRandom(max: number): Promise<number> {
  try {
    const randomBytes = await withTimeout(
      Crypto.getRandomBytesAsync(4),
      2000,
      null
    );
    if (randomBytes) {
      const randomValue = new DataView(randomBytes.buffer).getUint32(0, true);
      return randomValue % max;
    }
  } catch {
    // Silently fail - Math.random is not secure but good enough for our use case
  }
  // Fallback to Math.random if crypto fails
  return Math.floor(Math.random() * max);
}

/**
 * Fisher-Yates shuffle with crypto-secure randomness
 */
async function shuffleArray<T>(array: T[]): Promise<T[]> {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = await secureRandom(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create initial game state
 */
export function createInitialState(): GameState {
  return {
    players: [],
    selectedCategory: 'mixta',
    shuffledPlayers: [],
    currentPlayerIndex: 0,
    impostorIndex: -1,
    secretWord: '',
    starterPlayer: '',
    currentScreen: 'setup',
  };
}

/**
 * Validate game state structure
 */
function isValidGameState(data: unknown): data is Partial<GameState> {
  if (!data || typeof data !== 'object') return false;
  const state = data as Record<string, unknown>;
  if (state.players !== undefined) {
    if (!Array.isArray(state.players)) return false;
    if (!state.players.every(p => typeof p === 'string')) return false;
  }
  if (state.selectedCategory !== undefined && typeof state.selectedCategory !== 'string') {
    return false;
  }
  return true;
}

/**
 * Save game state to storage (resilient)
 */
export async function saveGameState(state: Partial<GameState>): Promise<boolean> {
  try {
    const existing = await loadGameState();
    const merged = { ...existing, ...state };
    const json = JSON.stringify(merged);
    return await safeStorageSet(STORAGE_KEY, json);
  } catch {
    return false;
  }
}

/**
 * Load game state from storage (resilient)
 */
export async function loadGameState(): Promise<Partial<GameState>> {
  try {
    const saved = await safeStorageGet(STORAGE_KEY);
    const parsed = safeJsonParse<Partial<GameState>>(saved, isValidGameState);
    if (parsed) {
      return parsed;
    }
    if (saved !== null) {
      await safeStorageRemove(STORAGE_KEY);
    }
  } catch {
    // Silently fail and return empty state
  }
  return {};
}

/**
 * Clear all saved game state (resilient)
 */
export async function clearGameState(): Promise<boolean> {
  return await safeStorageRemove(STORAGE_KEY);
}

// ============ CATEGORY MANAGEMENT ============

/**
 * Validate category structure
 */
function isValidCategory(cat: unknown): cat is Category {
  if (!cat || typeof cat !== 'object') return false;
  const c = cat as Record<string, unknown>;
  return typeof c.emoji === 'string' &&
         typeof c.name === 'string' &&
         Array.isArray(c.words) &&
         c.words.every(w => typeof w === 'string');
}

/**
 * Validate categories object
 */
function isValidCategories(data: unknown): data is Categories {
  if (!data || typeof data !== 'object') return false;
  return Object.values(data).every(isValidCategory);
}

/**
 * Load custom categories from storage (resilient)
 */
export async function loadCustomCategories(): Promise<void> {
  try {
    const saved = await safeStorageGet(CUSTOM_CATEGORIES_KEY);
    const customCategories = safeJsonParse<Categories>(saved, isValidCategories);

    if (customCategories) {
      CATEGORIES = updateMixedCategory({
        ...DEFAULT_CATEGORIES,
        ...customCategories,
      });
    } else {
      if (saved !== null) {
        await safeStorageRemove(CUSTOM_CATEGORIES_KEY);
      }
      CATEGORIES = updateMixedCategory({ ...DEFAULT_CATEGORIES });
    }
  } catch {
    CATEGORIES = updateMixedCategory({ ...DEFAULT_CATEGORIES });
  }
}

/**
 * Save custom categories to storage (resilient)
 */
export async function saveCustomCategories(): Promise<boolean> {
  try {
    const customCategories: Categories = {};

    for (const [key, category] of Object.entries(CATEGORIES)) {
      if (key === 'mixta') continue;

      const defaultCategory = DEFAULT_CATEGORIES[key];
      if (!defaultCategory || category.isCustom) {
        customCategories[key] = { ...category, isCustom: true };
      } else {
        const wordsChanged = JSON.stringify(category.words) !== JSON.stringify(defaultCategory.words);
        const metaChanged = category.name !== defaultCategory.name ||
                          category.emoji !== defaultCategory.emoji;

        if (wordsChanged || metaChanged) {
          customCategories[key] = category;
        }
      }
    }

    return await safeStorageSet(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  } catch {
    return false;
  }
}

/**
 * Reset all categories to defaults (resilient)
 */
export async function resetCategoriesToDefault(): Promise<boolean> {
  const success = await safeStorageRemove(CUSTOM_CATEGORIES_KEY);
  CATEGORIES = updateMixedCategory({ ...DEFAULT_CATEGORIES });
  return success;
}

/**
 * Get current categories
 */
export function getCategories(): Categories {
  return CATEGORIES;
}

/**
 * Update a category's words
 */
export async function updateCategoryWords(key: string, words: string[]): Promise<void> {
  if (key === 'mixta') return; // Can't modify mixta directly

  if (CATEGORIES[key]) {
    CATEGORIES[key] = {
      ...CATEGORIES[key],
      words,
    };
    CATEGORIES = updateMixedCategory(CATEGORIES);
    await saveCustomCategories();
  }
}

/**
 * Add a word to a category
 */
export async function addWordToCategory(key: string, word: string): Promise<void> {
  if (key === 'mixta') return;

  if (CATEGORIES[key] && !CATEGORIES[key].words.includes(word)) {
    CATEGORIES[key].words.push(word);
    CATEGORIES = updateMixedCategory(CATEGORIES);
    await saveCustomCategories();
  }
}

/**
 * Remove a word from a category
 */
export async function removeWordFromCategory(key: string, word: string): Promise<void> {
  if (key === 'mixta') return;

  if (CATEGORIES[key]) {
    CATEGORIES[key].words = CATEGORIES[key].words.filter(w => w !== word);
    CATEGORIES = updateMixedCategory(CATEGORIES);
    await saveCustomCategories();
  }
}

/**
 * Create a new custom category
 */
export async function createCategory(
  key: string,
  name: string,
  emoji: string,
  words: string[] = []
): Promise<boolean> {
  if (CATEGORIES[key]) return false; // Key already exists

  CATEGORIES[key] = {
    emoji,
    name,
    words,
    isCustom: true,
  };
  CATEGORIES = updateMixedCategory(CATEGORIES);
  await saveCustomCategories();
  return true;
}

/**
 * Delete a custom category
 */
export async function deleteCategory(key: string): Promise<boolean> {
  if (key === 'mixta') return false;
  if (!CATEGORIES[key]?.isCustom) return false; // Can only delete custom categories

  delete CATEGORIES[key];
  CATEGORIES = updateMixedCategory(CATEGORIES);
  await saveCustomCategories();
  return true;
}

/**
 * Update category metadata
 */
export async function updateCategoryMeta(
  key: string,
  updates: { name?: string; emoji?: string }
): Promise<void> {
  if (key === 'mixta') return;

  if (CATEGORIES[key]) {
    CATEGORIES[key] = {
      ...CATEGORIES[key],
      ...updates,
    };
    await saveCustomCategories();
  }
}

/**
 * Check if a category has been modified from default
 */
export function isCategoryModified(key: string): boolean {
  if (key === 'mixta') return false;
  if (!DEFAULT_CATEGORIES[key]) return true; // Custom category

  const current = CATEGORIES[key];
  const defaultCat = DEFAULT_CATEGORIES[key];

  return JSON.stringify(current.words) !== JSON.stringify(defaultCat.words) ||
         current.name !== defaultCat.name ||
         current.emoji !== defaultCat.emoji;
}

/**
 * Reset a single category to default
 */
export async function resetCategoryToDefault(key: string): Promise<void> {
  if (key === 'mixta' || !DEFAULT_CATEGORIES[key]) return;

  CATEGORIES[key] = { ...DEFAULT_CATEGORIES[key] };
  CATEGORIES = updateMixedCategory(CATEGORIES);
  await saveCustomCategories();
}

// ============ GAME FUNCTIONS ============

/**
 * Start a new game with current players
 */
export async function startNewGame(
  players: string[],
  category: CategoryKey
): Promise<Pick<GameState, 'shuffledPlayers' | 'impostorIndex' | 'secretWord' | 'starterPlayer'>> {
  // Shuffle players for random order
  const shuffledPlayers = await shuffleArray(players);

  // Select impostor
  const impostorIndex = await secureRandom(shuffledPlayers.length);

  // Get words for category
  const words = CATEGORIES[category]?.words || CATEGORIES.mixta.words;

  // Select secret word
  const wordIndex = await secureRandom(words.length);
  const secretWord = words[wordIndex];

  // Select starter player
  const starterIndex = await secureRandom(shuffledPlayers.length);
  const starterPlayer = shuffledPlayers[starterIndex];

  return {
    shuffledPlayers,
    impostorIndex,
    secretWord,
    starterPlayer,
  };
}

/**
 * Get category info for display
 */
export function getCategoryOptions() {
  return Object.entries(CATEGORIES).map(([key, value]) => ({
    key,
    emoji: value.emoji,
    name: value.name,
    wordCount: value.words.length,
    isCustom: value.isCustom || false,
    isModified: isCategoryModified(key),
  }));
}
