
import { StyleSheet } from 'react-native';

// Light theme colors
export const lightColors = {
  background: '#F8FAF9',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  primary: '#10B981',
  secondary: '#34D399',
  accent: '#F59E0B',
  highlight: '#FBBF24',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

// Dark theme colors - Black and Golden
export const darkColors = {
  background: '#000000',
  card: '#1A1A1A',
  text: '#FFD700',
  textSecondary: '#D4AF37',
  primary: '#FFD700',
  secondary: '#FFC700',
  accent: '#FFD700',
  highlight: '#FFA500',
  border: '#333333',
  error: '#FF6B6B',
  success: '#FFD700',
};

// Default to light theme
export const colors = lightColors;

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
