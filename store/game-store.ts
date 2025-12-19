/**
 * Game store - manages all game state and logic
 * Uses crypto-secure randomness for fair gameplay
 */

import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEY = 'impostor_game_v1';
const CUSTOM_CATEGORIES_KEY = 'impostor_custom_categories_v1';

// Category type definition
export interface Category {
  emoji: string;
  name: string;
  description: string;
  words: string[];
  isCustom?: boolean;
}

export type Categories = Record<string, Category>;

// Default categories with expanded word lists
export const DEFAULT_CATEGORIES: Categories = {
  mixta: {
    emoji: '🎲',
    name: 'Mixta',
    description: 'Todas las categorías',
    words: [], // Will be populated dynamically
  },
  lugares: {
    emoji: '📍',
    name: 'Lugares',
    description: 'Aeropuerto, Hospital, etc.',
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
    description: 'Pizza, Sushi, Tacos, etc.',
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
    description: 'León, Pingüino, etc.',
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
    description: 'Doctor, Chef, etc.',
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
    description: 'Teléfono, Reloj, etc.',
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
    description: 'Carro, Avión, etc.',
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
    description: 'Felicidad, Tristeza, etc.',
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
    description: 'Correr, Bailar, etc.',
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
    description: 'Géneros y clásicos del cine',
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
    description: 'Fútbol, Tenis, etc.',
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
    description: 'Géneros e instrumentos',
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
 * Generate cryptographically secure random number
 */
async function secureRandom(max: number): Promise<number> {
  const randomBytes = await Crypto.getRandomBytesAsync(4);
  const randomValue = new DataView(randomBytes.buffer).getUint32(0, true);
  return randomValue % max;
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
 * Save game state to storage
 */
export async function saveGameState(state: Partial<GameState>): Promise<void> {
  try {
    const existing = await loadGameState();
    const merged = { ...existing, ...state };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

/**
 * Load game state from storage
 */
export async function loadGameState(): Promise<Partial<GameState>> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load game state:', error);
  }
  return {};
}

/**
 * Clear all saved game state
 */
export async function clearGameState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

// ============ CATEGORY MANAGEMENT ============

/**
 * Load custom categories from storage
 */
export async function loadCustomCategories(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (saved) {
      const customCategories: Categories = JSON.parse(saved);
      // Merge with defaults, custom categories override defaults
      CATEGORIES = updateMixedCategory({
        ...DEFAULT_CATEGORIES,
        ...customCategories,
      });
    } else {
      CATEGORIES = updateMixedCategory({ ...DEFAULT_CATEGORIES });
    }
  } catch (error) {
    console.error('Failed to load custom categories:', error);
    CATEGORIES = updateMixedCategory({ ...DEFAULT_CATEGORIES });
  }
}

/**
 * Save custom categories to storage
 */
export async function saveCustomCategories(): Promise<void> {
  try {
    // Only save categories that differ from defaults or are custom
    const customCategories: Categories = {};

    for (const [key, category] of Object.entries(CATEGORIES)) {
      if (key === 'mixta') continue; // Don't save mixta, it's auto-generated

      const defaultCategory = DEFAULT_CATEGORIES[key];
      if (!defaultCategory || category.isCustom) {
        // New custom category
        customCategories[key] = { ...category, isCustom: true };
      } else {
        // Check if modified from default
        const wordsChanged = JSON.stringify(category.words) !== JSON.stringify(defaultCategory.words);
        const metaChanged = category.name !== defaultCategory.name ||
                          category.emoji !== defaultCategory.emoji ||
                          category.description !== defaultCategory.description;

        if (wordsChanged || metaChanged) {
          customCategories[key] = category;
        }
      }
    }

    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  } catch (error) {
    console.error('Failed to save custom categories:', error);
  }
}

/**
 * Reset all categories to defaults
 */
export async function resetCategoriesToDefault(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CUSTOM_CATEGORIES_KEY);
    CATEGORIES = updateMixedCategory({ ...DEFAULT_CATEGORIES });
  } catch (error) {
    console.error('Failed to reset categories:', error);
  }
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
  description: string,
  words: string[] = []
): Promise<boolean> {
  if (CATEGORIES[key]) return false; // Key already exists

  CATEGORIES[key] = {
    emoji,
    name,
    description,
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
  updates: { name?: string; emoji?: string; description?: string }
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
         current.emoji !== defaultCat.emoji ||
         current.description !== defaultCat.description;
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
    description: value.description,
    wordCount: value.words.length,
    isCustom: value.isCustom || false,
    isModified: isCategoryModified(key),
  }));
}
