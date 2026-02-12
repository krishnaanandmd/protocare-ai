import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Mode } from "../types";
import { colors, borderRadius, spacing, fontSize } from "../theme";

type Props = {
  mode: Mode;
};

export function Disclaimer({ mode }: Props) {
  if (mode === "PATIENT") {
    return (
      <View style={[styles.container, styles.patientContainer]}>
        <Ionicons name="warning" size={20} color={colors.amber400} />
        <View style={styles.textContainer}>
          <Text style={styles.patientTitle}>Important Notice</Text>
          <Text style={styles.patientDescription}>
            This tool provides general education based on your surgeon's
            protocols. It does not replace professional medical advice. Always
            follow your surgeon's specific instructions.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.providerContainer]}>
      <Ionicons
        name="information-circle"
        size={20}
        color={colors.cyan400}
      />
      <View style={styles.textContainer}>
        <Text style={styles.providerTitle}>Clinical Decision Support</Text>
        <Text style={styles.providerDescription}>
          Evidence-based answers from surgeon protocols and published research.
          Always apply clinical judgment.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  patientContainer: {
    backgroundColor: colors.amberAlpha20,
    borderColor: "rgba(245, 158, 11, 0.5)",
  },
  providerContainer: {
    backgroundColor: colors.cyanAlpha20,
    borderColor: "rgba(6, 182, 212, 0.5)",
  },
  textContainer: {
    flex: 1,
  },
  patientTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.amber300,
    marginBottom: spacing.xs,
  },
  patientDescription: {
    fontSize: fontSize.sm,
    color: "rgba(252, 211, 77, 0.8)",
    lineHeight: 18,
  },
  providerTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.cyan400,
    marginBottom: spacing.xs,
  },
  providerDescription: {
    fontSize: fontSize.sm,
    color: "rgba(34, 211, 238, 0.8)",
    lineHeight: 18,
  },
});
