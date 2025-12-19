import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GameColors, Spacing, BorderRadius } from '@/constants/theme';
import { clearCorruptedData } from '@/store/game-store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary that catches unhandled errors
 * and provides a recovery mechanism
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = async () => {
    try {
      // Clear potentially corrupted data
      await clearCorruptedData();
    } catch {
      // Ignore errors during cleanup
    }
    // Reset error state to retry rendering
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>¡Ups! Algo salió mal</Text>
          <Text style={styles.message}>
            La app encontró un error inesperado.
          </Text>
          <Text style={styles.submessage}>
            Toca el botón para reiniciar la app.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Reiniciar App</Text>
          </TouchableOpacity>
          {__DEV__ && this.state.error && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>
                {this.state.error.message}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GameColors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: GameColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  submessage: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: GameColors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugContainer: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: GameColors.card,
    borderRadius: BorderRadius.md,
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: GameColors.danger,
    marginBottom: Spacing.sm,
  },
  debugText: {
    fontSize: 10,
    color: GameColors.textMuted,
    fontFamily: 'monospace',
  },
});
