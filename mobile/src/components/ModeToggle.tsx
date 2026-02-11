import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Mode } from "../types";
import { colors, borderRadius, spacing, fontSize } from "../theme";

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <View style={styles.container}>
      {(["PATIENT", "PROVIDER"] as const).map((m) => (
        <TouchableOpacity
          key={m}
          onPress={() => onChange(m)}
          style={[styles.button, mode === m && styles.activeButton]}
        >
          <Text style={[styles.text, mode === m && styles.activeText]}>
            {m === "PATIENT" ? "Patient" : "Provider"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.whiteAlpha10,
    borderRadius: borderRadius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  activeButton: {
    backgroundColor: colors.white,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.slate300,
  },
  activeText: {
    color: colors.slate900,
  },
});
