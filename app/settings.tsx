import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { GameColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PatternBackground } from '@/components/pattern-background';
import {
  getCategories,
  getCategoryOptions,
  loadCustomCategories,
  resetCategoriesToDefault,
  resetCategoryToDefault,
  addWordToCategory,
  removeWordFromCategory,
  createCategory,
  deleteCategory,
  isCategoryModified,
} from '@/store/game-store';

export default function SettingsScreen() {
  const [categories, setCategories] = useState(getCategoryOptions());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryWords, setCategoryWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📝');

  useEffect(() => {
    loadCustomCategories().then(() => {
      setCategories(getCategoryOptions());
    });
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'success' | 'warning' | 'error') => {
    const notificationTypes = ['success', 'warning', 'error'];
    if (notificationTypes.includes(type)) {
      Haptics.notificationAsync(
        type === 'success' ? Haptics.NotificationFeedbackType.Success :
        type === 'warning' ? Haptics.NotificationFeedbackType.Warning :
        Haptics.NotificationFeedbackType.Error
      );
    } else {
      Haptics.impactAsync(
        type === 'light' ? Haptics.ImpactFeedbackStyle.Light :
        Haptics.ImpactFeedbackStyle.Medium
      );
    }
  }, []);

  const refreshCategories = useCallback(() => {
    setCategories(getCategoryOptions());
    if (selectedCategory) {
      const cats = getCategories();
      if (cats[selectedCategory]) {
        setCategoryWords([...cats[selectedCategory].words]);
      }
    }
  }, [selectedCategory]);

  const handleSelectCategory = useCallback((key: string) => {
    hapticFeedback('light');
    if (key === 'mixta') {
      Alert.alert('Info', 'La categoría Mixta se genera automáticamente con todas las palabras de las demás categorías.');
      return;
    }
    setSelectedCategory(key);
    const cats = getCategories();
    setCategoryWords([...cats[key].words]);
  }, [hapticFeedback]);

  const handleAddWord = useCallback(async () => {
    const word = newWord.trim();
    if (!word || !selectedCategory) return;

    if (categoryWords.includes(word)) {
      hapticFeedback('error');
      Alert.alert('Error', 'Esta palabra ya existe en la categoría.');
      return;
    }

    hapticFeedback('light');
    await addWordToCategory(selectedCategory, word);
    setNewWord('');
    refreshCategories();
  }, [newWord, selectedCategory, categoryWords, hapticFeedback, refreshCategories]);

  const handleRemoveWord = useCallback(async (word: string) => {
    if (!selectedCategory) return;

    hapticFeedback('medium');
    await removeWordFromCategory(selectedCategory, word);
    refreshCategories();
  }, [selectedCategory, hapticFeedback, refreshCategories]);

  const handleResetCategory = useCallback(async () => {
    if (!selectedCategory) return;

    Alert.alert(
      'Restaurar categoría',
      '¿Restaurar esta categoría a sus valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: async () => {
            hapticFeedback('warning');
            await resetCategoryToDefault(selectedCategory);
            refreshCategories();
          },
        },
      ]
    );
  }, [selectedCategory, hapticFeedback, refreshCategories]);

  const handleResetAll = useCallback(() => {
    Alert.alert(
      'Restaurar todo',
      '¿Restaurar TODAS las categorías a sus valores por defecto? Se perderán todas las personalizaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar todo',
          style: 'destructive',
          onPress: async () => {
            hapticFeedback('warning');
            await resetCategoriesToDefault();
            setSelectedCategory(null);
            setCategoryWords([]);
            refreshCategories();
          },
        },
      ]
    );
  }, [hapticFeedback, refreshCategories]);

  const handleCreateCategory = useCallback(async () => {
    const name = newCategoryName.trim();
    const emoji = newCategoryEmoji.trim() || '📝';

    if (!name) {
      hapticFeedback('error');
      Alert.alert('Error', 'El nombre es requerido.');
      return;
    }

    const key = name.toLowerCase().replace(/\s+/g, '_');
    const success = await createCategory(key, name, emoji);

    if (!success) {
      hapticFeedback('error');
      Alert.alert('Error', 'Ya existe una categoría con ese nombre.');
      return;
    }

    hapticFeedback('success');
    setShowNewCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryEmoji('📝');
    refreshCategories();
    setSelectedCategory(key);
    setCategoryWords([]);
  }, [newCategoryName, newCategoryEmoji, hapticFeedback, refreshCategories]);

  const handleDeleteCategory = useCallback(async () => {
    if (!selectedCategory) return;

    const cat = getCategories()[selectedCategory];
    if (!cat?.isCustom) {
      Alert.alert('Error', 'Solo puedes eliminar categorías personalizadas.');
      return;
    }

    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            hapticFeedback('warning');
            await deleteCategory(selectedCategory);
            setSelectedCategory(null);
            setCategoryWords([]);
            refreshCategories();
          },
        },
      ]
    );
  }, [selectedCategory, hapticFeedback, refreshCategories]);

  const currentCategory = selectedCategory ? getCategories()[selectedCategory] : null;
  const isModified = selectedCategory ? isCategoryModified(selectedCategory) : false;
  const isCustom = currentCategory?.isCustom || false;
  const canReset = isModified && !isCustom;

  return (
    <PatternBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              hapticFeedback('light');
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={GameColors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚙️ Configuración</Text>
          {!selectedCategory ? (
            <TouchableOpacity
              style={styles.addCategoryHeaderButton}
              onPress={() => {
                hapticFeedback('light');
                setShowNewCategoryModal(true);
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category List */}
        {!selectedCategory && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <Text style={styles.sectionSubtitle}>
              Toca una categoría para editar sus palabras
            </Text>

            {categories.map((cat, index) => (
              <Animated.View
                key={cat.key}
                entering={SlideInRight.delay(index * 30)}
                layout={Layout}
              >
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    cat.key === 'mixta' && styles.categoryItemDisabled,
                  ]}
                  onPress={() => handleSelectCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryNameRow}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      {cat.isCustom && (
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>Personalizada</Text>
                        </View>
                      )}
                      {cat.isModified && !cat.isCustom && (
                        <View style={styles.modifiedBadge}>
                          <Text style={styles.modifiedBadgeText}>Modificada</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.categoryDescription}>
                      {cat.wordCount} palabras
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Reset All Button */}
            <TouchableOpacity
              style={styles.resetAllButton}
              onPress={handleResetAll}
              activeOpacity={0.8}
            >
              <Text style={styles.resetAllButtonText}>
                🔄 Restaurar todo a valores por defecto
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Category Detail */}
        {selectedCategory && currentCategory && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <TouchableOpacity
              style={styles.backToCategories}
              onPress={() => {
                hapticFeedback('light');
                setSelectedCategory(null);
                setCategoryWords([]);
              }}
            >
              <Text style={styles.backToCategoriesText}>← Categorías</Text>
            </TouchableOpacity>

            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderEmoji}>{currentCategory.emoji}</Text>
              <Text style={styles.categoryHeaderName}>{currentCategory.name}</Text>
            </View>

            {/* Add Word */}
            <View style={styles.addWordRow}>
              <TextInput
                style={styles.addWordInput}
                placeholder="Nueva palabra..."
                placeholderTextColor={GameColors.textMuted}
                value={newWord}
                onChangeText={setNewWord}
                onSubmitEditing={handleAddWord}
                returnKeyType="done"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={styles.addWordButton}
                onPress={handleAddWord}
                activeOpacity={0.8}
              >
                <Text style={styles.addWordButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Words List */}
            <Text style={styles.wordsCount}>
              {categoryWords.length} palabras
            </Text>

            <View style={styles.wordsList}>
              {categoryWords.map((word, index) => (
                <Animated.View
                  key={`${word}-${index}`}
                  entering={SlideInRight.delay(index * 20)}
                  exiting={SlideOutLeft}
                  layout={Layout}
                  style={styles.wordItem}
                >
                  <Text style={styles.wordText}>{word}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveWord(word)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeWordButton}>✖</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {canReset && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetCategory}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>
                    🔄 Restaurar valores por defecto
                  </Text>
                </TouchableOpacity>
              )}

              {isCustom && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteCategory}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteButtonText}>
                    🗑️ Eliminar categoría
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* New Category Modal */}
      <Modal
        visible={showNewCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Categoría</Text>

            <Text style={styles.inputLabel}>Emoji</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="📝"
              placeholderTextColor={GameColors.textMuted}
              value={newCategoryEmoji}
              onChangeText={setNewCategoryEmoji}
              maxLength={2}
            />

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre de la categoría"
              placeholderTextColor={GameColors.textMuted}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  hapticFeedback('light');
                  setShowNewCategoryModal(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreateCategory}
              >
                <Text style={styles.modalCreateButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: GameColors.card,
    borderBottomWidth: 1,
    borderBottomColor: GameColors.inputBorder,
    ...Shadows.small,
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: GameColors.backgroundAlt,
    borderRadius: BorderRadius.full,
  },
  headerTitle: {
    color: GameColors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 44,
  },
  addCategoryHeaderButton: {
    padding: Spacing.sm,
    backgroundColor: GameColors.accent,
    borderRadius: BorderRadius.full,
    ...Shadows.colored(GameColors.accent),
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: GameColors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: GameColors.textSecondary,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  categoryItemDisabled: {
    opacity: 0.5,
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '600',
    color: GameColors.text,
  },
  customBadge: {
    backgroundColor: GameColors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  customBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modifiedBadge: {
    backgroundColor: GameColors.warningLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  modifiedBadgeText: {
    fontSize: 10,
    color: GameColors.warning,
    fontWeight: 'bold',
  },
  categoryDescription: {
    fontSize: 13,
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: GameColors.textMuted,
  },
  resetAllButton: {
    backgroundColor: GameColors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  resetAllButtonText: {
    color: GameColors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  backToCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backToCategoriesText: {
    color: GameColors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: GameColors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  categoryHeaderEmoji: {
    fontSize: 44,
    marginRight: Spacing.md,
  },
  categoryHeaderName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: GameColors.text,
  },
  addWordRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addWordInput: {
    flex: 1,
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: GameColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
  },
  addWordButton: {
    backgroundColor: GameColors.accent,
    borderRadius: BorderRadius.lg,
    width: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.colored(GameColors.accent),
  },
  addWordButtonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  wordsCount: {
    color: GameColors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
  },
  wordText: {
    color: GameColors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  removeWordButton: {
    color: GameColors.danger,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  resetButton: {
    backgroundColor: GameColors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  resetButtonText: {
    color: GameColors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: GameColors.dangerLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: GameColors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: GameColors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...Shadows.large,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GameColors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: GameColors.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: GameColors.input,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: GameColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: GameColors.input,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GameColors.inputBorder,
  },
  modalCancelButtonText: {
    color: GameColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: GameColors.accent,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.colored(GameColors.accent),
  },
  modalCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
