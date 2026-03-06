
import { StyleSheet } from 'react-native';

// Calo - Fresh, healthy color palette
export const colors = {
  // Light theme colors
  background: '#F8FAF9',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  primary: '#10B981', // Fresh green
  secondary: '#34D399',
  accent: '#F59E0B', // Warm orange
  highlight: '#FBBF24',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  
  // Dark theme colors
  darkBackground: '#0F172A',
  darkCard: '#1E293B',
  darkText: '#F1F5F9',
  darkTextSecondary: '#94A3B8',
  darkBorder: '#334155',
};

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
