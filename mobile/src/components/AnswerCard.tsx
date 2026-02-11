import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { Answer, Mode } from "../types";
import { colors, borderRadius, spacing, fontSize } from "../theme";

type Props = {
  mode: Mode;
  data: Answer;
  doctorName?: string;
  onFollowUp?: (question: string) => void;
};

export function AnswerCard({ mode, data, doctorName, onFollowUp }: Props) {
  const { answer, citations, latency_ms, follow_up_question } = data;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.white}
            />
          </View>
          <Text style={styles.headerTitle}>
            {doctorName
              ? `${doctorName}'s Evidence-Based Answer`
              : "Evidence-Based Answer"}
          </Text>
        </View>
        <View style={styles.latencyBadge}>
          <Text style={styles.latencyText}>{latency_ms}ms</Text>
        </View>
      </View>

      {/* Answer content */}
      <View style={styles.answerContent}>
        <Markdown style={markdownStyles}>{answer}</Markdown>
      </View>

      {/* Citations */}
      <View style={styles.citationsSection}>
        <View style={styles.citationsHeader}>
          <Ionicons name="document-text" size={16} color={colors.slate300} />
          <Text style={styles.citationsTitle}>Sources</Text>
        </View>

        {citations.length === 0 ? (
          <Text style={styles.noCitations}>No specific sources cited.</Text>
        ) : (
          <View style={styles.citationsList}>
            {citations.map((c, idx) => {
              const label = c.display_label || c.title;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.citationBadge}
                  onPress={() => {
                    if (c.document_url) {
                      Linking.openURL(c.document_url);
                    }
                  }}
                  disabled={!c.document_url}
                >
                  <View style={styles.citationNumber}>
                    <Text style={styles.citationNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.citationLabel} numberOfLines={2}>
                    {label}
                  </Text>
                  {c.document_url && (
                    <Ionicons
                      name="open-outline"
                      size={12}
                      color={colors.cyan400}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Patient disclaimer */}
      {mode === "PATIENT" && (
        <View style={styles.disclaimerSection}>
          <Ionicons
            name="information-circle"
            size={14}
            color={colors.slate400}
          />
          <Text style={styles.disclaimerText}>
            Always follow your surgeon's specific instructions. This is for
            educational purposes only.
          </Text>
        </View>
      )}

      {/* Follow-up question */}
      {follow_up_question && (
        <View style={styles.followUpSection}>
          <Text style={styles.followUpLabel}>Want to dive deeper?</Text>
          <TouchableOpacity
            onPress={() => onFollowUp?.(follow_up_question)}
            style={styles.followUpButton}
          >
            <Ionicons
              name="help-circle"
              size={18}
              color={colors.cyan400}
            />
            <Text style={styles.followUpText}>{follow_up_question}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Feedback */}
      <TouchableOpacity
        style={styles.feedbackButton}
        onPress={() => Linking.openURL("https://forms.gle/Eve2QFNknvkLzWwS9")}
      >
        <Ionicons name="thumbs-up" size={16} color={colors.cyan400} />
        <Text style={styles.feedbackText}>
          Enjoyed your experience? Share your feedback!
        </Text>
        <Ionicons name="open-outline" size={14} color={colors.cyan400} />
      </TouchableOpacity>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.white,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  heading1: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: "700" as const,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  heading2: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: "600" as const,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  heading3: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: "600" as const,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  strong: {
    color: colors.white,
    fontWeight: "700" as const,
  },
  em: {
    color: colors.slate300,
    fontStyle: "italic" as const,
  },
  bullet_list: {
    marginVertical: spacing.sm,
  },
  ordered_list: {
    marginVertical: spacing.sm,
  },
  list_item: {
    marginVertical: 2,
  },
  link: {
    color: colors.cyan400,
  },
  paragraph: {
    marginVertical: spacing.xs,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.whiteAlpha10,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.emerald500,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
    flex: 1,
  },
  latencyBadge: {
    backgroundColor: colors.whiteAlpha10,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
  },
  latencyText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
    color: colors.slate400,
  },
  answerContent: {
    borderTopWidth: 0,
  },
  citationsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.whiteAlpha20,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  citationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  citationsTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.slate300,
  },
  noCitations: {
    fontSize: fontSize.sm,
    color: colors.slate400,
    fontStyle: "italic",
  },
  citationsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  citationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.whiteAlpha05,
    borderWidth: 1,
    borderColor: colors.whiteAlpha10,
  },
  citationNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cyan600,
    alignItems: "center",
    justifyContent: "center",
  },
  citationNumberText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
  citationLabel: {
    fontSize: fontSize.sm,
    color: colors.slate300,
    flexShrink: 1,
    maxWidth: 200,
  },
  disclaimerSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.whiteAlpha20,
    paddingTop: spacing.lg,
  },
  disclaimerText: {
    fontSize: fontSize.xs,
    color: colors.slate400,
    flex: 1,
    lineHeight: 16,
  },
  followUpSection: {
    borderTopWidth: 1,
    borderTopColor: colors.whiteAlpha20,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  followUpLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.slate300,
  },
  followUpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cyanAlpha20,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  followUpText: {
    fontSize: fontSize.md,
    fontWeight: "500",
    color: colors.white,
    flex: 1,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cyanAlpha20,
    borderWidth: 2,
    borderColor: "rgba(6, 182, 212, 0.3)",
  },
  feedbackText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.white,
  },
});
