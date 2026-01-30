import { FontAwesome5 } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

const PIXEL_FONT = "monospace";

export default function LeaderboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ title: "LEADERBOARD" }} />

      <View style={styles.content}>
        <FontAwesome5
          name="trophy"
          size={80}
          color="#555"
          style={styles.icon}
        />
        <Text style={styles.title}>COMING DAY 2</Text>
        <Text style={styles.subtitle}>
          Compete with other farmers globally.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { alignItems: "center", padding: 30 },
  icon: { marginBottom: 30, opacity: 0.8 },
  title: {
    color: "white",
    fontSize: 28,
    fontFamily: PIXEL_FONT,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 2,
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 250,
    lineHeight: 22,
    fontFamily: PIXEL_FONT,
  },
});
