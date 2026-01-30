import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/utils/supabase";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const LANGUAGES = [
  { id: "hi", name: "हिन्दी/HINDI", locked: false },
  { id: "en", name: "ENGLISH", locked: false },
  { id: "pa", name: "ਪੰਜਾਬੀ/PUNJABI", locked: true },
  { id: "ml", name: "മലയാളം/MALAYALAM", locked: true },
  { id: "ta", name: "தமிழ்/TAMIL", locked: true },
  { id: "kn", name: "ಕನ್ನಡ/KANNADA", locked: true },
  { id: "te", name: "తెలుగు/TELUGU", locked: true },
  { id: "kok", name: "कोंकणी/KONKANI", locked: true },
  { id: "mr", name: "मराठी/MARATHI", locked: true },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t, setLanguage, isLoading: isTransLoading } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (selectedLanguage) {
      try {
        setLanguage(selectedLanguage);
        await AsyncStorage.setItem("onboarding_lang", selectedLanguage);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          await supabase
            .from("profiles")
            .update({ language: selectedLanguage })
            .eq("id", session.user.id);
        }

        router.replace("/crop");
      } catch (error) {
        console.error("Error saving language:", error);
      }
    }
  };

  const handleLanguageSelect = (lang: (typeof LANGUAGES)[0]) => {
    if (lang.locked) {
      // You can add a toast or alert here if desired,
      // but visual cue (greyed out) is often enough.
      return;
    }
    setSelectedLanguage(lang.id);
  };

  if (isTransLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#388e3c" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t("choose_language")}</Text>
        <Text style={styles.subtitle}>
          {t("choose_your_language_in_hindi")}
        </Text>

        <View style={styles.listContainer}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[
                styles.languageButton,
                lang.locked && styles.languageButtonLocked,
                selectedLanguage === lang.id && styles.languageButtonSelected,
              ]}
              onPress={() => handleLanguageSelect(lang)}
              activeOpacity={lang.locked ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  lang.locked && styles.textLocked,
                ]}
              >
                {lang.name}
              </Text>
              {lang.locked && (
                <FontAwesome5
                  name="lock"
                  size={14}
                  color="#666"
                  style={{ marginLeft: 10 }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.noteText}>{t("language_change_note")}</Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={[
            styles.confirmButton,
            selectedLanguage
              ? styles.confirmButtonActive
              : styles.confirmButtonDisabled,
          ]}
          disabled={!selectedLanguage}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>{t("confirm")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#151718" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#151718",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#B0B0B0",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  listContainer: { width: "100%", maxWidth: 400 },
  languageButton: {
    backgroundColor: "#333333",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginVertical: 7,
    borderWidth: 1,
    borderColor: "#555555",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  languageButtonSelected: {
    backgroundColor: "#388e3c",
    borderColor: "#388e3c",
  },
  languageButtonLocked: {
    backgroundColor: "#222",
    borderColor: "#333",
    opacity: 0.7,
  },
  languageButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  textLocked: { color: "#666" },
  noteText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
  confirmButton: {
    width: "100%",
    maxWidth: 400,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
  },
  confirmButtonDisabled: { backgroundColor: "#555555" },
  confirmButtonActive: { backgroundColor: "#388e3c" },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
