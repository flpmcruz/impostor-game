import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GameColors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Pattern items - fun detective/mystery themed emojis
const PATTERN_ITEMS = ['🕵️', '❓', '🎭', '👀', '🤫', '💬', '🔍', '✨', '🎪', '🃏'];

interface PatternBackgroundProps {
  children: React.ReactNode;
}

export function PatternBackground({ children }: PatternBackgroundProps) {
  // Generate pattern items
  const patternElements = React.useMemo(() => {
    const elements = [];
    const cols = 5;
    const rows = Math.ceil(height / 120);
    const itemWidth = width / cols;
    const itemHeight = 120;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = (row * cols + col) % PATTERN_ITEMS.length;
        const offsetX = row % 2 === 0 ? 0 : itemWidth / 2;

        elements.push(
          <Text
            key={`${row}-${col}`}
            style={[
              styles.patternItem,
              {
                left: col * itemWidth + offsetX,
                top: row * itemHeight,
                transform: [{ rotate: `${(row + col) * 15}deg` }],
              },
            ]}
          >
            {PATTERN_ITEMS[index]}
          </Text>
        );
      }
    }
    return elements;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.patternContainer}>
        {patternElements}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternItem: {
    position: 'absolute',
    fontSize: 28,
    opacity: 0.07,
  },
  content: {
    flex: 1,
  },
});
