// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Image } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../src/constants/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: "transparent",
          height: 72 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              flex: 1,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.18)",
              backgroundColor: "rgba(7,24,47,0.55)",
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/tab-home-3d.png")}
              style={{
                width: 28,
                height: 28,
                opacity: focused ? 1 : 0.55,
                tintColor: focused ? "#2DD4BF" : undefined,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/tab-history-3d.png")}
              style={{
                width: 28,
                height: 28,
                opacity: focused ? 1 : 0.55,
                tintColor: focused ? "#2DD4BF" : undefined,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Paramètres",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/tab-settings-3d.png")}
              style={{
                width: 28,
                height: 28,
                opacity: focused ? 1 : 0.55,
                tintColor: focused ? "#2DD4BF" : undefined,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}