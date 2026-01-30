import { FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// --- IMPORTS FOR OFFLINE-FIRST ---
import { useCachedQuery } from "@/hooks/useCachedQuery"; // Used to be direct fetch
import { supabase } from "@/utils/supabase";

// --- ASSETS (Keep your existing imports) ---
import BananaIcon from "../assets/images/Banana.svg";
import PepperIcon from "../assets/images/black_pepper.svg";
import CardamomIcon from "../assets/images/cardamom.svg";
import CoconutIcon from "../assets/images/coconut.svg";
import CoffeeIcon from "../assets/images/coffee.svg";
// Fallback PNGs
const RiceImg = require("../assets/images/crops/rice.png");
const GingerImg = require("../assets/images/crops/ginger.png");
const CashewImg = require("../assets/images/crops/cashew.png");

const PIXEL_FONT = Platform.OS === "ios" ? "System" : "Roboto";

// --- FETCH FUNCTION (Moved outside component) ---
const fetchMarketPrices = async () => {
  const { data, error } = await supabase
    .from("market_prices")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
};

export default function MarketPricesScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  // --- UPDATED: OFFLINE-FIRST ARCHITECTURE ---
  // This loads from AsyncStore immediately, then updates from Supabase
  const {
    data: prices,
    loading,
    isOffline,
    refresh,
    refreshing,
  } = useCachedQuery("market_prices_v1", fetchMarketPrices);

  const priceList = prices || [];
  const globalSyncTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const filteredPrices = priceList.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- RENDERING HELPERS (Keep exactly as before) ---
  const renderCropIcon = (cropId: string) => {
    const style = styles.cropIcon;
    switch (cropId) {
      case "banana":
        return <BananaIcon width={45} height={45} />;
      case "black_pepper":
        return <PepperIcon width={45} height={45} />;
      case "cardamom":
        return <CardamomIcon width={45} height={45} />;
      case "coconut":
        return <CoconutIcon width={45} height={45} />;
      case "coffee":
        return <CoffeeIcon width={45} height={45} />;
      case "rice":
        return <Image source={RiceImg} style={style} />;
      case "ginger":
        return <Image source={GingerImg} style={style} />;
      case "cashew":
        return <Image source={CashewImg} style={style} />;
      default:
        return <FontAwesome5 name="leaf" size={32} color="#4CAF50" />;
    }
  };

  const getTrendStyles = (trend: string) => {
    switch (trend) {
      case "up":
        return {
          color: "#69F0AE",
          icon: "caret-up",
          bg: "rgba(105, 240, 174, 0.15)",
        };
      case "down":
        return {
          color: "#FF5252",
          icon: "caret-down",
          bg: "rgba(255, 82, 82, 0.15)",
        };
      default:
        return {
          color: "#B0B0B0",
          icon: "minus",
          bg: "rgba(255, 255, 255, 0.05)",
        };
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "Unknown";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MARKET RATES</Text>
          <Text style={styles.headerSubtitle}>
            {isOffline ? "Offline Mode" : `Sync: ${globalSyncTime}`}
          </Text>
        </View>
        <View style={styles.liveBadge}>
          <View
            style={[styles.liveDot, isOffline && { backgroundColor: "gray" }]}
          />
          <Text style={[styles.liveText, isOffline && { color: "gray" }]}>
            {isOffline ? "OFFLINE" : "LIVE"}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <FontAwesome5
            name="search"
            size={14}
            color="#888"
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Find your crop..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List - Using cached data immediately while loading happens in background */}
      {loading && !prices ? (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color="#388E3C" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#388E3C"
            />
          }
        >
          {filteredPrices.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="inbox" size={40} color="#333" />
              <Text style={styles.emptyText}>No crops found</Text>
            </View>
          ) : (
            filteredPrices.map((item: any) => {
              const trendStyle = getTrendStyles(item.trend);

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.iconBox}>
                      {renderCropIcon(item.crop_id)}
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.cropName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cropUnit}>
                        Updated: {formatDate(item.last_updated)}
                      </Text>
                    </View>

                    <View style={styles.priceCol}>
                      <Text style={styles.priceText}>
                        ₹{item.price.toLocaleString()}
                      </Text>
                      <Text style={styles.perUnitText}>/ {item.unit}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View
                      style={[
                        styles.trendPill,
                        { backgroundColor: trendStyle.bg },
                      ]}
                    >
                      <FontAwesome5
                        name={trendStyle.icon as any}
                        size={12}
                        color={trendStyle.color}
                      />
                      <Text
                        style={[styles.trendText, { color: trendStyle.color }]}
                      >
                        {item.trend === "stable" ? "Stable" : `₹${item.change}`}
                      </Text>
                    </View>
                    <Text style={styles.marketLabel}>Avg. Mandi Price</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// (Keep your styles exactly the same as before)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontFamily: PIXEL_FONT,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.3)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5252",
    marginRight: 6,
  },
  liveText: { color: "#FF5252", fontSize: 10, fontWeight: "bold" },
  searchWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#333",
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontFamily: PIXEL_FONT,
  },
  loadingView: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 20, paddingBottom: 50 },
  emptyState: { alignItems: "center", marginTop: 60, opacity: 0.5 },
  emptyText: { color: "#666", marginTop: 10, fontFamily: PIXEL_FONT },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    overflow: "hidden",
  },
  cardRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  iconBox: {
    width: 56,
    height: 56,
    backgroundColor: "#252525",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  cropIcon: { width: 35, height: 35, resizeMode: "contain" },
  infoCol: { flex: 1 },
  cropName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cropUnit: { color: "#666", fontSize: 11, fontFamily: PIXEL_FONT },
  priceCol: { alignItems: "flex-end" },
  priceText: {
    color: "#E0E0E0",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: PIXEL_FONT,
  },
  perUnitText: { color: "#666", fontSize: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  trendText: { fontSize: 11, fontWeight: "bold" },
  marketLabel: {
    color: "#444",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: PIXEL_FONT,
  },
});
