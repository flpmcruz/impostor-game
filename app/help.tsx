import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { GameColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { PatternBackground } from '@/components/pattern-background';

export default function HelpScreen() {
  const hapticFeedback = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Silently ignore
    }
  };

  return (
    <PatternBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              hapticFeedback();
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={GameColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cómo Jugar</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Objective */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Objetivo</Text>
            <Text style={styles.sectionText}>
              El Impostor es un juego de deducción social. Hay una palabra secreta que todos conocen... excepto el impostor.
            </Text>
            <Text style={styles.sectionText}>
              Los ciudadanos deben descubrir quién es el impostor, mientras el impostor intenta pasar desapercibido.
            </Text>
          </Animated.View>

          {/* How to Play */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 Cómo Jugar</Text>
            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Agrega a los jugadores (mínimo 3)</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Selecciona una categoría y un modo de juego</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Cada jugador ve su rol en privado</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>Hagan preguntas sobre la palabra secreta</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>5</Text>
                <Text style={styles.stepText}>El impostor finge conocer la palabra</Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>6</Text>
                <Text style={styles.stepText}>Voten para descubrir al impostor</Text>
              </View>
            </View>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Game Modes Title */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={styles.mainTitle}>🎭 Modos de Juego</Text>
          </Animated.View>

          {/* Classic Mode */}
          <Animated.View entering={FadeInDown.delay(350)} style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeEmoji}>🎭</Text>
              <View style={styles.modeHeaderText}>
                <Text style={styles.modeName}>Clásico</Text>
                <Text style={styles.modeSubtitle}>Mínimo 3 jugadores</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              1 impostor vs ciudadanos. El modo original y más sencillo.
            </Text>
            <View style={styles.winConditions}>
              <Text style={styles.winTitle}>Condiciones de victoria:</Text>
              <Text style={styles.winItem}>
                🏆 <Text style={styles.bold}>Ciudadanos:</Text> Descubren al impostor
              </Text>
              <Text style={styles.winItem}>
                👺 <Text style={styles.bold}>Impostor:</Text> No es descubierto
              </Text>
            </View>
          </Animated.View>

          {/* Double Impostor Mode */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeEmoji}>👺👺</Text>
              <View style={styles.modeHeaderText}>
                <Text style={styles.modeName}>Doble Agente</Text>
                <Text style={styles.modeSubtitle}>Mínimo 5 jugadores</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              2 impostores que NO se conocen entre sí. ¡Máxima paranoia!
            </Text>
            <View style={styles.highlight}>
              <Text style={styles.highlightText}>
                ⚡ Los impostores pueden acusarse entre ellos sin saberlo
              </Text>
            </View>
            <View style={styles.winConditions}>
              <Text style={styles.winTitle}>Condiciones de victoria:</Text>
              <Text style={styles.winItem}>
                🏆 <Text style={styles.bold}>Ciudadanos:</Text> Descubren a AMBOS impostores
              </Text>
              <Text style={styles.winItem}>
                👺 <Text style={styles.bold}>Impostores:</Text> Quedan igual o más que ciudadanos
              </Text>
            </View>
          </Animated.View>

          {/* Accomplices Mode */}
          <Animated.View entering={FadeInDown.delay(450)} style={styles.modeCard}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeEmoji}>🤝</Text>
              <View style={styles.modeHeaderText}>
                <Text style={styles.modeName}>Compinches</Text>
                <Text style={styles.modeSubtitle}>Mínimo 5 jugadores</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              2 impostores que SÍ se conocen. Pueden coordinarse y cubrirse mutuamente.
            </Text>
            <View style={styles.highlight}>
              <Text style={styles.highlightText}>
                ⚡ Más estratégico y difícil para los ciudadanos
              </Text>
            </View>
            <View style={styles.winConditions}>
              <Text style={styles.winTitle}>Condiciones de victoria:</Text>
              <Text style={styles.winItem}>
                🏆 <Text style={styles.bold}>Ciudadanos:</Text> Descubren a AMBOS impostores
              </Text>
              <Text style={styles.winItem}>
                👺 <Text style={styles.bold}>Impostores:</Text> Trabajan en equipo para ganar
              </Text>
            </View>
          </Animated.View>

          {/* Jester Mode */}
          <Animated.View entering={FadeInDown.delay(500)} style={[styles.modeCard, styles.jesterCard]}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeEmoji}>🤡</Text>
              <View style={styles.modeHeaderText}>
                <Text style={styles.modeName}>Bufón</Text>
                <Text style={styles.modeSubtitle}>Mínimo 4 jugadores</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              1 impostor + 1 bufón travieso. El bufón SÍ conoce la palabra pero quiere ser votado.
            </Text>
            <View style={[styles.highlight, styles.jesterHighlight]}>
              <Text style={styles.highlightText}>
                🎭 El bufón debe actuar sospechoso... ¡pero no muy obvio!
              </Text>
            </View>
            <View style={styles.winConditions}>
              <Text style={styles.winTitle}>Condiciones de victoria:</Text>
              <Text style={styles.winItem}>
                🏆 <Text style={styles.bold}>Ciudadanos:</Text> Votan al impostor (no al bufón)
              </Text>
              <Text style={styles.winItem}>
                👺 <Text style={styles.bold}>Impostor:</Text> No es descubierto
              </Text>
              <Text style={[styles.winItem, styles.jesterWin]}>
                🤡 <Text style={styles.bold}>Bufón:</Text> ¡Es votado como sospechoso!
              </Text>
            </View>
          </Animated.View>

          {/* Chaos Mode */}
          <Animated.View entering={FadeInDown.delay(550)} style={[styles.modeCard, styles.chaosCard]}>
            <View style={styles.modeHeader}>
              <Text style={styles.modeEmoji}>🌪️</Text>
              <View style={styles.modeHeaderText}>
                <Text style={styles.modeName}>Caos Total</Text>
                <Text style={styles.modeSubtitle}>Mínimo 6 jugadores</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              2 impostores + 1 bufón. ¡Máxima confusión con 3 roles especiales!
            </Text>
            <View style={[styles.highlight, styles.chaosHighlight]}>
              <Text style={styles.highlightText}>
                💥 El modo más difícil y divertido
              </Text>
            </View>
            <View style={styles.winConditions}>
              <Text style={styles.winTitle}>Condiciones de victoria:</Text>
              <Text style={styles.winItem}>
                🏆 <Text style={styles.bold}>Ciudadanos:</Text> Eliminan a ambos impostores
              </Text>
              <Text style={styles.winItem}>
                👺 <Text style={styles.bold}>Impostores:</Text> Sobreviven sin ser descubiertos
              </Text>
              <Text style={[styles.winItem, styles.jesterWin]}>
                🤡 <Text style={styles.bold}>Bufón:</Text> Logra ser votado
              </Text>
            </View>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Tips */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Consejos</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tip}>
                • Haz preguntas que solo quien conoce la palabra pueda responder bien
              </Text>
              <Text style={styles.tip}>
                • Observa quién da respuestas vagas o evasivas
              </Text>
              <Text style={styles.tip}>
                • Como impostor, sé específico pero cuidadoso
              </Text>
              <Text style={styles.tip}>
                • En modos con bufón, cuidado con votar muy rápido
              </Text>
              <Text style={styles.tip}>
                • ¡Lo más importante: diviértanse!
              </Text>
            </View>
          </Animated.View>

          {/* Spacer for bottom */}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: GameColors.inputBorder,
    backgroundColor: GameColors.card,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: GameColors.backgroundAlt,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GameColors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: GameColors.text,
    marginBottom: Spacing.md,
  },
  sectionText: {
    fontSize: 16,
    color: GameColors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  stepContainer: {
    gap: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: GameColors.accent,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: Spacing.md,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: GameColors.text,
  },
  divider: {
    height: 2,
    backgroundColor: GameColors.inputBorder,
    marginVertical: Spacing.lg,
    borderRadius: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modeCard: {
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.inputBorder,
    ...Shadows.medium,
  },
  jesterCard: {
    borderColor: GameColors.jester + '60',
  },
  chaosCard: {
    borderColor: GameColors.accent + '60',
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modeEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  modeHeaderText: {
    flex: 1,
  },
  modeName: {
    fontSize: 20,
    fontWeight: '700',
    color: GameColors.text,
  },
  modeSubtitle: {
    fontSize: 13,
    color: GameColors.textMuted,
    marginTop: 2,
  },
  modeDescription: {
    fontSize: 15,
    color: GameColors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  highlight: {
    backgroundColor: GameColors.accentLight + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: GameColors.accent,
  },
  jesterHighlight: {
    backgroundColor: GameColors.jesterLight,
    borderLeftColor: GameColors.jester,
  },
  chaosHighlight: {
    backgroundColor: GameColors.accentLight + '30',
    borderLeftColor: GameColors.accent,
  },
  highlightText: {
    fontSize: 14,
    color: GameColors.text,
    fontWeight: '500',
  },
  winConditions: {
    backgroundColor: GameColors.backgroundAlt,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  winTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GameColors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  winItem: {
    fontSize: 14,
    color: GameColors.textSecondary,
    lineHeight: 22,
  },
  jesterWin: {
    color: GameColors.jester,
  },
  bold: {
    fontWeight: '700',
    color: GameColors.text,
  },
  tipsList: {
    backgroundColor: GameColors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.small,
  },
  tip: {
    fontSize: 15,
    color: GameColors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
});
