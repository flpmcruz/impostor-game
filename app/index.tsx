import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PatternBackground } from '@/components/pattern-background';
import { BorderRadius, GameColors, Shadows, Spacing } from '@/constants/theme';
import {
  clearGameState,
  createInitialState,
  GAME_VARIANTS,
  GameState,
  getCategories,
  getCategoryOptions,
  isVariantValid,
  loadCustomCategories,
  loadGameState,
  saveGameState,
  startNewGame,
} from '@/store/game-store';

export default function ImpostorGame() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [playerInput, setPlayerInput] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(getCategoryOptions());
  const isInitialLoad = useRef(true);

  // Track if we've navigated away (to know when to refresh on focus)
  const hasNavigatedAway = React.useRef(false);

  // Load saved state on mount (categories already loaded in _layout.tsx)
  useEffect(() => {
    (async () => {
      try {
        // Categories already loaded in _layout.tsx, just get current options
        setCategoryOptions(getCategoryOptions());

        const saved = await loadGameState();

        if (saved.players && saved.players.length > 0) {
          setState(prev => ({
            ...prev,
            players: saved.players || [],
            selectedCategory: saved.selectedCategory || 'mixta',
            selectedVariant: saved.selectedVariant || 'classic',
          }));
        }

        // Enable animations after initial render
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 100);
      } catch {
        setCategoryOptions(getCategoryOptions());
      }
    })();
  }, []);

  // Refresh categories ONLY when returning from settings
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we previously navigated away
      if (hasNavigatedAway.current) {
        loadCustomCategories()
          .then(() => setCategoryOptions(getCategoryOptions()))
          .catch(() => setCategoryOptions(getCategoryOptions()));
        hasNavigatedAway.current = false;
      }

      // Track when we leave this screen
      return () => {
        hasNavigatedAway.current = true;
      };
    }, [])
  );

  // Save players when they change (fire and forget, don't block UI)
  useEffect(() => {
    if (state.players.length > 0) {
      saveGameState({
        players: state.players,
        selectedCategory: state.selectedCategory,
        selectedVariant: state.selectedVariant,
      }).catch(() => {
        // Silently fail - not critical
      });
    }
  }, [state.players, state.selectedCategory, state.selectedVariant]);

  // Safe haptic feedback that won't crash the app
  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'success' | 'warning' | 'error') => {
    try {
      const styles: Record<string, Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType> = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      };

      if (type === 'success' || type === 'warning' || type === 'error') {
        Haptics.notificationAsync(styles[type] as Haptics.NotificationFeedbackType).catch(() => { });
      } else {
        Haptics.impactAsync(styles[type] as Haptics.ImpactFeedbackStyle).catch(() => { });
      }
    } catch {
      // Haptics not available - silently ignore
    }
  }, []);

  const addPlayer = useCallback(() => {
    const name = playerInput.trim();
    if (name && !state.players.includes(name)) {
      hapticFeedback('light');
      setState(prev => ({
        ...prev,
        players: [...prev.players, name],
      }));
      setPlayerInput('');
    }
  }, [playerInput, state.players, hapticFeedback]);

  const removePlayer = useCallback((index: number) => {
    hapticFeedback('medium');
    setState(prev => ({
      ...prev,
      players: prev.players.filter((_, i) => i !== index),
    }));
  }, [hapticFeedback]);

  const handleStartGame = useCallback(async () => {
    const variantConfig = GAME_VARIANTS[state.selectedVariant];

    if (state.players.length < variantConfig.minPlayers) {
      hapticFeedback('error');
      Alert.alert(
        'Jugadores insuficientes',
        `El modo "${variantConfig.name}" necesita al menos ${variantConfig.minPlayers} jugadores`
      );
      return;
    }

    try {
      hapticFeedback('success');
      const gameData = await startNewGame(
        state.players,
        state.selectedCategory,
        state.selectedVariant
      );

      setState(prev => ({
        ...prev,
        ...gameData,
        currentPlayerIndex: 0,
        currentScreen: 'pass',
      }));
    } catch {
      hapticFeedback('error');
      Alert.alert('Error', 'No se pudo iniciar el juego. Intenta de nuevo.');
    }
  }, [state.players, state.selectedCategory, state.selectedVariant, hapticFeedback]);

  const handleRevealRole = useCallback(() => {
    hapticFeedback('medium');
    setIsButtonDisabled(true);

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentScreen: 'reveal',
      }));
      setIsButtonDisabled(false);
    }, 300);
  }, [hapticFeedback]);

  const handleNextPlayer = useCallback(() => {
    hapticFeedback('light');
    setIsButtonDisabled(true);

    const nextIndex = state.currentPlayerIndex + 1;

    if (nextIndex < state.shuffledPlayers.length) {
      setState(prev => ({
        ...prev,
        currentPlayerIndex: nextIndex,
        currentScreen: 'pass',
      }));
    } else {
      hapticFeedback('success');
      setState(prev => ({
        ...prev,
        currentScreen: 'playing',
      }));
    }

    setTimeout(() => setIsButtonDisabled(false), 500);
  }, [state.currentPlayerIndex, state.shuffledPlayers.length, hapticFeedback]);

  const handleEndGame = useCallback(() => {
    hapticFeedback('success');
    setState(prev => ({
      ...prev,
      currentScreen: 'end',
    }));
  }, [hapticFeedback]);

  const handlePlayAgain = useCallback(async () => {
    try {
      hapticFeedback('medium');
      const gameData = await startNewGame(
        state.players,
        state.selectedCategory,
        state.selectedVariant
      );

      setState(prev => ({
        ...prev,
        ...gameData,
        currentPlayerIndex: 0,
        currentScreen: 'pass',
      }));
    } catch {
      hapticFeedback('error');
      Alert.alert('Error', 'No se pudo iniciar el juego. Intenta de nuevo.');
    }
  }, [state.players, state.selectedCategory, state.selectedVariant, hapticFeedback]);

  const handleResetAll = useCallback(() => {
    Alert.alert(
      '¿Estás seguro?',
      'Se borrarán todos los jugadores y el progreso del juego.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              hapticFeedback('warning');
              await clearGameState();
              setState(createInitialState());
            } catch {
              // Reset state anyway even if storage clear fails
              setState(createInitialState());
            }
          },
        },
      ]
    );
  }, [hapticFeedback]);

  const handleBackToSetup = useCallback(() => {
    hapticFeedback('light');
    setState(prev => ({
      ...prev,
      currentScreen: 'setup',
    }));
  }, [hapticFeedback]);

  // Get current player's role info
  const currentPlayerRole = state.playerRoles[state.currentPlayerIndex];
  const currentPlayer = state.shuffledPlayers[state.currentPlayerIndex];
  const categories = getCategories();
  const selectedCategoryInfo = categories[state.selectedCategory] || categories.mixta;
  const selectedVariantInfo = GAME_VARIANTS[state.selectedVariant];

  return (
    <PatternBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* SETUP SCREEN */}
          {state.currentScreen === 'setup' && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.screenContainer}
            >
              {/* Header Row: Category + Variant + Help + Settings */}
              <View style={styles.headerRow}>
                <View style={styles.headerChips}>
                  <TouchableOpacity
                    style={styles.categoryChip}
                    onPress={() => {
                      hapticFeedback('light');
                      setShowCategoryPicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryChipEmoji}>
                      {selectedCategoryInfo.emoji}
                    </Text>
                    <Text style={styles.categoryChipText} numberOfLines={1}>
                      {selectedCategoryInfo.name}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={GameColors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !isVariantValid(state.selectedVariant, state.players.length) && styles.chipDisabled
                    ]}
                    onPress={() => {
                      hapticFeedback('light');
                      setShowVariantPicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryChipText}>
                      {selectedVariantInfo.emoji}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={GameColors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => {
                      hapticFeedback('light');
                      router.push('/help');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.helpButtonText}>?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => {
                      hapticFeedback('light');
                      router.push('/settings');
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="settings-outline" size={22} color={GameColors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fixed Header Section */}
              <View style={styles.setupHeader}>
                <Text style={styles.title}>🕵️‍♂️ El Impostor</Text>
                <Text style={styles.subtitle}>
                  Agrega a los jugadores (Mínimo 3)
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre del jugador..."
                    placeholderTextColor={GameColors.textMuted}
                    value={playerInput}
                    onChangeText={setPlayerInput}
                    onSubmitEditing={addPlayer}
                    returnKeyType="done"
                    autoCapitalize="words"
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={addPlayer}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable Player List */}
              <ScrollView
                style={styles.playerScrollView}
                contentContainerStyle={styles.playerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {state.players.length > 0 && (
                  <View style={styles.playerList}>
                    {state.players.map((player, index) => (
                      <Animated.View
                        key={`${player}-${index}`}
                        entering={isInitialLoad.current ? undefined : SlideInRight.delay(index * 50)}
                        exiting={SlideOutLeft}
                        style={styles.playerItem}
                      >
                        <Text style={styles.playerName}>{player}</Text>
                        <TouchableOpacity
                          onPress={() => removePlayer(index)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={styles.removeButton}>✖</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Floating Action Button */}
              {state.players.length >= 3 && (
                <Animated.View
                  entering={ZoomIn.springify()}
                  style={styles.fabContainer}
                >
                  <TouchableOpacity
                    style={styles.fab}
                    onPress={handleStartGame}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* PASS SCREEN */}
          {state.currentScreen === 'pass' && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.centerContainer}
            >
              <Text style={styles.progressText}>
                Jugador {state.currentPlayerIndex + 1} de{' '}
                {state.shuffledPlayers.length}
              </Text>

              <Text style={styles.title}>
                Turno de:{' '}
                <Text style={styles.accentText}>{currentPlayer}</Text>
              </Text>

              <Animated.Text
                entering={ZoomIn.delay(200)}
                style={styles.bigEmoji}
              >
                🤫
              </Animated.Text>

              <Text style={styles.instruction}>
                Pasa el dispositivo a este jugador.
              </Text>
              <Text style={styles.instruction}>
                Asegúrate de que nadie más mire.
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isButtonDisabled && styles.buttonDisabled,
                ]}
                onPress={handleRevealRole}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Ver mi papel</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* REVEAL SCREEN */}
          {state.currentScreen === 'reveal' && currentPlayerRole && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.centerContainer}
            >
              <Text style={styles.roleTitle}>
                {currentPlayerRole.role === 'citizen' ? 'LA PALABRA ES' : 'TÚ ERES EL'}
              </Text>

              <Animated.View
                entering={ZoomIn.delay(200).springify()}
                style={[
                  styles.roleCard,
                  currentPlayerRole.role === 'impostor' && styles.impostorCard,
                  currentPlayerRole.role === 'citizen' && styles.citizenCard,
                  currentPlayerRole.role === 'jester' && styles.jesterCard,
                ]}
              >
                {/* Role display based on player's role */}
                {currentPlayerRole.role === 'impostor' && (
                  <>
                    <Text style={[styles.secretWord, { color: GameColors.impostor }]}>
                      👺 IMPOSTOR
                    </Text>
                    <Text style={styles.roleDescription}>
                      No sabes la palabra secreta. ¡Miente y mézclate!
                    </Text>
                    {currentPlayerRole.partnerName && (
                      <View style={styles.partnerInfo}>
                        <Text style={styles.partnerLabel}>Tu compinche es:</Text>
                        <Text style={styles.partnerName}>{currentPlayerRole.partnerName}</Text>
                      </View>
                    )}
                  </>
                )}

                {currentPlayerRole.role === 'jester' && (
                  <>
                    <Text style={[styles.secretWord, { color: GameColors.jester }]}>
                      🤡 BUFÓN
                    </Text>
                    <Text style={styles.roleDescription}>
                      ¡Tu objetivo es que te voten! Actúa sospechoso pero no muy obvio.
                    </Text>
                    <View style={styles.wordHint}>
                      <Text style={styles.wordHintLabel}>La palabra es:</Text>
                      <Text style={styles.wordHintValue}>{state.secretWord}</Text>
                    </View>
                  </>
                )}

                {currentPlayerRole.role === 'citizen' && (
                  <>
                    <Text style={[styles.secretWord, { color: GameColors.citizen }]}>
                      {state.secretWord}
                    </Text>
                    <Text style={styles.roleDescription}>
                      Eres un ciudadano inocente. Encuentra al impostor.
                    </Text>
                  </>
                )}
              </Animated.View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isButtonDisabled && styles.buttonDisabled,
                ]}
                onPress={handleNextPlayer}
                disabled={isButtonDisabled}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Entendido, ocultar</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* PLAYING SCREEN */}
          {state.currentScreen === 'playing' && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.centerContainer}
            >
              <Text style={styles.title}>¡A JUGAR! 🗣️</Text>

              <View style={styles.variantBadge}>
                <Text style={styles.variantBadgeText}>
                  {selectedVariantInfo.emoji} {selectedVariantInfo.name}
                </Text>
              </View>

              <Text style={styles.instruction}>
                {state.impostorIndices.length > 1
                  ? 'Los impostores están entre nosotros.'
                  : 'El impostor está entre nosotros.'}
              </Text>
              <Text style={styles.instruction}>
                Hagan preguntas sutiles para descubrirlo{state.impostorIndices.length > 1 ? 's' : ''}.
              </Text>
              {state.jesterIndex >= 0 && (
                <Text style={[styles.instruction, { color: GameColors.jester }]}>
                  ⚠️ ¡Cuidado! Hay un bufón que quiere ser votado.
                </Text>
              )}

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Jugador Inicial Sugerido:</Text>
                <Text style={styles.infoValue}>{state.starterPlayer}</Text>
              </View>

              <TouchableOpacity
                style={styles.endGameButton}
                onPress={handleEndGame}
                activeOpacity={0.8}
              >
                <Text style={styles.endGameButtonText}>
                  🎭 Finalizar y Revelar Roles
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handlePlayAgain}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  Jugar de nuevo (mismos jugadores)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleResetAll}
                activeOpacity={0.8}
              >
                <Text style={styles.dangerButtonText}>
                  🗑️ Borrar todo y empezar de cero
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* END SCREEN */}
          {state.currentScreen === 'end' && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.centerContainer}
            >
              <Text style={styles.title}>🎭 ¡JUEGO TERMINADO!</Text>

              <ScrollView
                style={styles.endScrollView}
                contentContainerStyle={styles.endScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Impostors reveal */}
                <Animated.View
                  entering={ZoomIn.delay(200)}
                  style={styles.revealCard}
                >
                  <Text style={styles.revealLabel}>
                    {state.impostorIndices.length > 1 ? 'Los impostores eran:' : 'El impostor era:'}
                  </Text>
                  {state.impostorIndices.map((idx, i) => (
                    <Text key={idx} style={styles.impostorName}>
                      👺 {state.shuffledPlayers[idx]}
                    </Text>
                  ))}
                </Animated.View>

                {/* Jester reveal (if applicable) */}
                {state.jesterIndex >= 0 && (
                  <Animated.View
                    entering={ZoomIn.delay(300)}
                    style={styles.jesterRevealCard}
                  >
                    <Text style={styles.revealLabel}>El bufón era:</Text>
                    <Text style={styles.jesterName}>
                      🤡 {state.shuffledPlayers[state.jesterIndex]}
                    </Text>
                  </Animated.View>
                )}

                {/* Word reveal */}
                <Animated.View
                  entering={ZoomIn.delay(400)}
                  style={styles.wordRevealCard}
                >
                  <Text style={styles.revealLabel}>La palabra secreta era:</Text>
                  <Text style={styles.wordReveal}>{state.secretWord}</Text>
                </Animated.View>

                {/* Win conditions hint */}
                <Animated.View
                  entering={FadeIn.delay(500)}
                  style={styles.winConditionsCard}
                >
                  <Text style={styles.winConditionsTitle}>¿Quién ganó?</Text>
                  <Text style={styles.winCondition}>
                    🏆 <Text style={{ fontWeight: '700' }}>Ciudadanos:</Text> Si votaron a{' '}
                    {state.impostorIndices.length > 1 ? 'los impostores' : 'el impostor'}
                  </Text>
                  <Text style={styles.winCondition}>
                    👺 <Text style={{ fontWeight: '700' }}>Impostor{state.impostorIndices.length > 1 ? 'es' : ''}:</Text> Si no fueron descubiertos
                  </Text>
                  {state.jesterIndex >= 0 && (
                    <Text style={styles.winCondition}>
                      🤡 <Text style={{ fontWeight: '700' }}>Bufón:</Text> Si fue votado como sospechoso
                    </Text>
                  )}
                </Animated.View>
              </ScrollView>

              <View style={styles.endButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handlePlayAgain}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    Jugar de nuevo (mismos jugadores)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackToSetup}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>
                    Volver a configuración
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={handleResetAll}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dangerButtonText}>
                    🗑️ Borrar todo y empezar de cero
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </KeyboardAvoidingView>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎯 Elige una categoría</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCategoryPicker(false)}
                >
                  <Ionicons name="close" size={24} color={GameColors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {categoryOptions.map((cat, index) => (
                  <Animated.View
                    key={cat.key}
                    entering={SlideInRight.delay(index * 30)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        state.selectedCategory === cat.key &&
                        styles.categoryOptionSelected,
                      ]}
                      onPress={() => {
                        hapticFeedback('light');
                        setState(prev => ({
                          ...prev,
                          selectedCategory: cat.key,
                        }));
                        setShowCategoryPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        <Text style={styles.categoryWordCount}>
                          {cat.wordCount} palabras
                        </Text>
                      </View>
                      {state.selectedCategory === cat.key && (
                        <Ionicons name="checkmark-circle" size={24} color={GameColors.accent} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Variant Picker Modal */}
        <Modal
          visible={showVariantPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVariantPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎮 Modo de Juego</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowVariantPicker(false)}
                >
                  <Ionicons name="close" size={24} color={GameColors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {Object.values(GAME_VARIANTS).map((variant, index) => {
                  const isAvailable = state.players.length >= variant.minPlayers;
                  return (
                    <Animated.View
                      key={variant.id}
                      entering={SlideInRight.delay(index * 30)}
                    >
                      <TouchableOpacity
                        style={[
                          styles.variantOption,
                          state.selectedVariant === variant.id && styles.variantOptionSelected,
                          !isAvailable && styles.variantOptionDisabled,
                        ]}
                        onPress={() => {
                          if (isAvailable) {
                            hapticFeedback('light');
                            setState(prev => ({
                              ...prev,
                              selectedVariant: variant.id,
                            }));
                            setShowVariantPicker(false);
                          } else {
                            hapticFeedback('warning');
                          }
                        }}
                        activeOpacity={isAvailable ? 0.7 : 1}
                      >
                        <Text style={styles.variantEmoji}>{variant.emoji}</Text>
                        <View style={styles.variantInfo}>
                          <Text style={[
                            styles.variantName,
                            !isAvailable && styles.variantNameDisabled
                          ]}>
                            {variant.name}
                          </Text>
                          <Text style={styles.variantDescription}>
                            {variant.description}
                          </Text>
                          <Text style={[
                            styles.variantMinPlayers,
                            !isAvailable && styles.variantMinPlayersWarning
                          ]}>
                            Mínimo {variant.minPlayers} jugadores
                            {!isAvailable && ` (faltan ${variant.minPlayers - state.players.length})`}
                          </Text>
                        </View>
                        {state.selectedVariant === variant.id && isAvailable && (
                          <Ionicons name="checkmark-circle" size={24} color={GameColors.accent} />
                        )}
                        {!isAvailable && (
                          <Ionicons name="lock-closed" size={20} color={GameColors.textMuted} />
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </PatternBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  setupHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  playerScrollView: {
    flex: 1,
  },
  playerScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
    flexShrink: 1,
    maxWidth: 160,
    ...Shadows.small,
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    color: GameColors.text,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GameColors.card,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.lg,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GameColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  accentText: {
    color: GameColors.accent,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: GameColors.text,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: GameColors.inputBorder,
    ...Shadows.small,
  },
  addButton: {
    backgroundColor: GameColors.accent,
    borderRadius: BorderRadius.lg,
    width: 54,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  playerList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GameColors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
    ...Shadows.small,
  },
  playerName: {
    color: GameColors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  removeButton: {
    color: GameColors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: GameColors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: GameColors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    ...Shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: GameColors.inputBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GameColors.text,
  },
  modalCloseButton: {
    padding: Spacing.sm,
    backgroundColor: GameColors.backgroundAlt,
    borderRadius: BorderRadius.full,
  },
  modalScrollContent: {
    padding: Spacing.md,
    paddingBottom: 50,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    backgroundColor: GameColors.backgroundAlt,
  },
  categoryOptionSelected: {
    backgroundColor: GameColors.accentLight + '30',
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  categoryEmoji: {
    fontSize: 36,
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: GameColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  categoryWordCount: {
    color: GameColors.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: GameColors.accent,
    padding: Spacing.md + 4,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.medium,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    backgroundColor: GameColors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1.5,
    borderColor: GameColors.inputBorder,
    ...Shadows.small,
  },
  secondaryButtonText: {
    color: GameColors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: GameColors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.danger,
  },
  dangerButtonText: {
    color: GameColors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  endGameButton: {
    backgroundColor: GameColors.warning,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.large,
  },
  endGameButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressText: {
    color: GameColors.accent,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    backgroundColor: GameColors.accentLight + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  bigEmoji: {
    fontSize: 100,
    marginVertical: Spacing.xl,
  },
  instruction: {
    color: GameColors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: GameColors.textSecondary,
    marginBottom: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roleCard: {
    borderWidth: 3,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginVertical: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadows.large,
  },
  impostorCard: {
    borderColor: GameColors.impostor,
    backgroundColor: GameColors.impostorLight,
  },
  citizenCard: {
    borderColor: GameColors.citizen,
    backgroundColor: GameColors.citizenLight,
  },
  secretWord: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  roleDescription: {
    color: GameColors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GameColors.accentLight,
    ...Shadows.medium,
  },
  infoLabel: {
    color: GameColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: GameColors.accent,
    fontSize: 26,
    fontWeight: 'bold',
  },
  revealCard: {
    borderWidth: 3,
    borderColor: GameColors.impostor,
    backgroundColor: GameColors.impostorLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
    ...Shadows.large,
  },
  wordRevealCard: {
    borderWidth: 3,
    borderColor: GameColors.citizen,
    backgroundColor: GameColors.citizenLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
    ...Shadows.large,
  },
  revealLabel: {
    color: GameColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  impostorName: {
    color: GameColors.impostor,
    fontSize: 30,
    fontWeight: '800',
  },
  wordReveal: {
    color: GameColors.citizen,
    fontSize: 30,
    fontWeight: '800',
  },
  // Header styles
  headerChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GameColors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  // Jester card style
  jesterCard: {
    borderColor: GameColors.jester,
    backgroundColor: GameColors.jesterLight,
  },
  // Partner info for accomplices mode
  partnerInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: GameColors.impostor + '40',
    alignItems: 'center',
  },
  partnerLabel: {
    color: GameColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  partnerName: {
    color: GameColors.impostor,
    fontSize: 20,
    fontWeight: '700',
  },
  // Word hint for jester
  wordHint: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: GameColors.jester + '40',
    alignItems: 'center',
  },
  wordHintLabel: {
    color: GameColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  wordHintValue: {
    color: GameColors.jester,
    fontSize: 24,
    fontWeight: '700',
  },
  // Variant badge on playing screen
  variantBadge: {
    backgroundColor: GameColors.accentLight + '30',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  variantBadgeText: {
    color: GameColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  // Variant picker styles
  variantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    backgroundColor: GameColors.backgroundAlt,
  },
  variantOptionSelected: {
    backgroundColor: GameColors.accentLight + '30',
    borderWidth: 2,
    borderColor: GameColors.accent,
  },
  variantOptionDisabled: {
    opacity: 0.5,
  },
  variantEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    color: GameColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  variantNameDisabled: {
    color: GameColors.textMuted,
  },
  variantDescription: {
    color: GameColors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  variantMinPlayers: {
    color: GameColors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  variantMinPlayersWarning: {
    color: GameColors.danger,
  },
  // End screen styles
  endScrollView: {
    flex: 1,
    width: '100%',
  },
  endScrollContent: {
    paddingBottom: Spacing.md,
  },
  endButtons: {
    width: '100%',
    paddingTop: Spacing.md,
  },
  jesterRevealCard: {
    borderWidth: 3,
    borderColor: GameColors.jester,
    backgroundColor: GameColors.jesterLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
    ...Shadows.large,
  },
  jesterName: {
    color: GameColors.jester,
    fontSize: 30,
    fontWeight: '800',
  },
  winConditionsCard: {
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
  },
  winConditionsTitle: {
    color: GameColors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  winCondition: {
    color: GameColors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
});
