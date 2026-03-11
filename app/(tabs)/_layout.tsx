
import React from 'react';
import { Platform } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  if (Platform.OS === 'ios') {
    return null;
  }

  const tabs = [
    {
      name: '(home)',
      route: '/(tabs)/(home)' as const,
      icon: 'home' as const,
      label: 'Home',
    },
    {
      name: 'history',
      route: '/(tabs)/history' as const,
      icon: 'calendar-today' as const,
      label: 'History',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile' as const,
      icon: 'person' as const,
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
        <Stack.Screen name="history" />

        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
