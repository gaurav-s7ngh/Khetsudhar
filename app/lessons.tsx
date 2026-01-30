import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DEFAULT_LANGUAGE } from "@/constants/translations";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/utils/supabase";

import Coin from "../assets/images/coin.svg";
import Mascot from "../assets/images/Mascot.svg";
import MascotFarmer from "../assets/images/MascotFarmer.svg";

// --- DAY 1 HARDCODED CONTENT ---
// We hardcode this to prevent Supabase from returning Lesson 4, 5, etc.
const STATIC_LESSONS = [
  {
    id: 1,
    sequence: 1,
    title_en: "Soil Health Basics",
    description_en: "Understanding your land's foundation.",
    points: 100,
  },
  {
    id: 2,
    sequence: 2,
    title_en: "Organic Fertilizers",
    description_en: "Boost crops naturally and safely.",
    points: 150,
  },
  {
    id: 3,
    sequence: 3,
    title_en: "Women in Farming",
    description_en: "Empowering communities together.",
    points: 200,
  },
];

interface LessonData {
  id: number;
  title: string;
  description: string;
  sequence: number;
  points: number;
}

interface Lesson extends LessonData {
  status: "current" | "completed" | "locked";
}

const fetchLessonsAndProgress = async (lang: string) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;

  // HARDCODED: Use static array instead of DB fetch for content
  const allLessonsRaw = STATIC_LESSONS;

  // Map static data to current language (mocking translation for Day 1)
  const allLessons: LessonData[] = allLessonsRaw.map((l: any) => ({
    id: l.id,
    sequence: l.sequence,
    points: l.points,
    title: l.title_en, // Force EN for demo consistency
    description: l.description_en,
  }));

  let completedIds = new Set<number>();
  let lastCompletedSeq = 0;

  // REAL FETCH: Only check progress from DB
  if (userId) {
    const { data: completedLessons } = await supabase
      .from("user_lessons")
      .select("lesson_id")
      .eq("user_id", userId);

    if (completedLessons) {
      completedLessons.forEach((c) => completedIds.add(c.lesson_id));

      const completedSeqs = allLessons
        .filter((l) => completedIds.has(l.id))
        .map((l) => l.sequence);

      if (completedSeqs.length > 0) {
        lastCompletedSeq = Math.max(...completedSeqs);
      }
    }
  }

  const finalLessons: Lesson[] = allLessons.map((lesson) => {
    let status: "current" | "completed" | "locked" = "locked";

    if (completedIds.has(lesson.id)) {
      status = "completed";
    } else if (lesson.sequence === lastCompletedSeq + 1) {
      status = "current";
    } else if (lastCompletedSeq === 0 && lesson.sequence === 1) {
      status = "current";
    }

    return { ...lesson, status };
  });

  return finalLessons;
};

export default function LessonsScreen() {
  const router = useRouter();
  const { t, language, isLoading: isTransLoading } = useTranslation();

  const {
    data: lessons,
    loading,
    isOffline,
    refresh,
    refreshing,
  } = useCachedQuery(`lessons_list_static_day1`, () =>
    fetchLessonsAndProgress(language || DEFAULT_LANGUAGE),
  );

  const { currentLesson, completedLessons, upcomingLessons, totalScore } =
    useMemo(() => {
      const list = lessons || [];
      return {
        currentLesson: list.find((l) => l.status === "current"),
        completedLessons: list.filter((l) => l.status === "completed"),
        upcomingLessons: list.filter((l) => l.status === "locked"),
        totalScore: list
          .filter((l) => l.status === "completed")
          .reduce((sum, l) => sum + l.points, 0),
      };
    }, [lessons]);

  const renderLessonCard = (lesson: Lesson, isCurrent = false) => {
    // SPECIAL STYLING: 3rd Lesson is Women Centric -> PINK
    const isWomenCentric = lesson.sequence === 3;

    return (
      <TouchableOpacity
        key={lesson.id}
        style={[
          styles.lessonCard,
          isCurrent && styles.currentLessonCard,
          lesson.status === "completed" && styles.completedLessonCard,
          lesson.status === "locked" && styles.lockedLessonCard,
          // Apply Pink Style if it's Lesson 3
          isWomenCentric && styles.pinkLessonCard,
        ]}
        disabled={lesson.status === "locked"}
        onPress={() =>
          router.push({
            pathname: "/lesson/[id]",
            params: { id: lesson.id.toString() },
          })
        }
      >
        <Text
          style={[styles.lessonNumber, isCurrent && styles.currentLessonNumber]}
        >
          {lesson.sequence}
        </Text>
        <View style={styles.lessonContent}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDescription} numberOfLines={2}>
            {lesson.description}
          </Text>
          <View style={styles.pointsContainer}>
            <Coin width={24} height={24} style={styles.coinIcon} />
            <Text style={styles.pointsText}>{lesson.points}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if ((loading || isTransLoading) && !lessons) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#388e3c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#388e3c"
          />
        }
      >
        {isOffline && (
          <View style={styles.offlineBanner}>
            <FontAwesome5 name="wifi" size={14} color="white" />
            <Text style={styles.offlineText}> Offline Mode</Text>
          </View>
        )}

        {/* 1. CURRENT LESSON */}
        {currentLesson && (
          <>
            <View style={styles.currentSection}>
              <Mascot width={140} height={140} style={styles.mascot} />
              <View style={styles.currentTag}>
                <Text style={styles.currentTagText}>CURRENT LESSON</Text>
              </View>
            </View>
            {renderLessonCard(currentLesson, true)}
          </>
        )}

        {/* 2. UPCOMING */}
        {upcomingLessons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>UPCOMING</Text>
            {upcomingLessons.map((l) => renderLessonCard(l))}
          </>
        )}

        {/* 3. COMPLETED */}
        {completedLessons.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>COMPLETED</Text>
            <View style={styles.completedSectionHeader}>
              <MascotFarmer
                width={100}
                height={100}
                style={styles.farmerMascot}
              />
              <Text style={styles.totalScore}>TOTAL SCORE {totalScore}</Text>
            </View>
            {completedLessons
              .sort((a, b) => b.sequence - a.sequence)
              .map((l) => renderLessonCard(l))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#151718" },
  container: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 30 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#151718",
  },
  offlineBanner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C62828",
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  offlineText: { color: "white", fontWeight: "bold", marginLeft: 8 },
  currentSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 90,
    marginBottom: -40,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  mascot: { transform: [{ translateX: -15 }] },
  currentTag: {
    backgroundColor: "#388e3c",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4CAF50",
    transform: [{ translateY: -30 }],
  },
  currentTagText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  sectionTitle: {
    color: "#777",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 25,
    letterSpacing: 1,
  },
  lessonCard: {
    backgroundColor: "#2C2C2E",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  currentLessonCard: {
    paddingLeft: 20,
    backgroundColor: "#222",
    borderColor: "#388e3c",
  },
  pinkLessonCard: { backgroundColor: "#880E4F", borderColor: "#E91E63" }, // PINK STYLE
  lockedLessonCard: { opacity: 0.6 },
  completedLessonCard: { backgroundColor: "#2E7D32", borderColor: "#388E3C" },
  lessonNumber: {
    color: "#555",
    fontSize: 80,
    fontWeight: "900",
    fontFamily: "monospace",
    marginRight: 15,
  },
  currentLessonNumber: { color: "#FFFFFF" },
  lessonContent: { flex: 1 },
  lessonTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  lessonDescription: { color: "#B0B0B0", fontSize: 14, lineHeight: 20 },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  coinIcon: { marginRight: 8 },
  pointsText: { color: "#FDD835", fontSize: 18, fontWeight: "bold" },
  completedSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  farmerMascot: { width: 100, height: 100 },
  totalScore: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});
