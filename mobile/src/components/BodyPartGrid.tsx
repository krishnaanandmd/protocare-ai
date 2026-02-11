import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BodyPart } from "../types";
import { colors, borderRadius, spacing, fontSize } from "../theme";

type Props = {
  bodyParts: BodyPart[];
  selectedBodyPartId: string | null;
  onSelect: (bodyPartId: string) => void;
};

const BODY_PART_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  shoulder: "body",
  elbow: "fitness",
  hand_wrist: "hand-left",
  hip: "accessibility",
  knee: "walk",
  ankle_foot: "footsteps",
  spine: "arrow-up",
};

export function BodyPartGrid({
  bodyParts,
  selectedBodyPartId,
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="body" size={20} color={colors.white} />
        </View>
        <Text style={styles.sectionTitle}>Select Body Part</Text>
      </View>

      <View style={styles.grid}>
        {bodyParts.map((bp) => {
          const isSelected = selectedBodyPartId === bp.id;
          return (
            <TouchableOpacity
              key={bp.id}
              onPress={() => onSelect(bp.id)}
              style={[styles.gridItem, isSelected && styles.gridItemSelected]}
            >
              <Ionicons
                name={BODY_PART_ICONS[bp.id] || "body"}
                size={22}
                color={isSelected ? colors.purple500 : colors.slate400}
              />
              <Text
                style={[
                  styles.gridItemText,
                  isSelected && styles.gridItemTextSelected,
                ]}
              >
                {bp.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedBodyPartId && (
        <View style={styles.selectedBanner}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.emerald400}
          />
          <Text style={styles.selectedText}>
            Using{" "}
            <Text style={styles.selectedName}>
              {bodyParts.find((b) => b.id === selectedBodyPartId)?.name}
            </Text>{" "}
            CareGuide model
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.purple500,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gridItem: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.whiteAlpha10,
    backgroundColor: colors.whiteAlpha05,
  },
  gridItemSelected: {
    borderColor: colors.purple500,
    backgroundColor: colors.purpleAlpha20,
  },
  gridItemText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.white,
  },
  gridItemTextSelected: {
    color: colors.white,
  },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.purpleAlpha20,
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
  },
  selectedText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.white,
    flex: 1,
  },
  selectedName: {
    fontWeight: "700",
  },
});
