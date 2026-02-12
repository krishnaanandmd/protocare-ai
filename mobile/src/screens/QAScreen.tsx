import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModeToggle } from "../components/ModeToggle";
import { DoctorPicker } from "../components/DoctorPicker";
import { BodyPartGrid } from "../components/BodyPartGrid";
import { Disclaimer } from "../components/Disclaimer";
import { AnswerCard } from "../components/AnswerCard";
import { fetchDoctors, queryRAG } from "../services/api";
import { Doctor, BodyPart, Answer, Mode } from "../types";
import { colors, borderRadius, spacing, fontSize } from "../theme";

const BODY_PARTS: BodyPart[] = [
  { id: "shoulder", name: "Shoulder", description: "Shoulder joint and rotator cuff" },
  { id: "elbow", name: "Elbow", description: "Elbow joint and surrounding structures" },
  { id: "hand_wrist", name: "Hand / Wrist", description: "Hand, wrist, and finger joints" },
  { id: "hip", name: "Hip", description: "Hip joint and surrounding structures" },
  { id: "knee", name: "Knee", description: "Knee joint including ACL, MCL, meniscus" },
  { id: "ankle_foot", name: "Ankle / Foot", description: "Ankle, foot, and toe joints" },
  { id: "spine", name: "Spine", description: "Cervical, thoracic, and lumbar spine" },
];

export function QAScreen() {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("PATIENT");
  const [data, setData] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors()
      .then(setDoctors)
      .catch((err) => console.error("Failed to fetch doctors:", err));
  }, []);

  const handleDoctorSelect = (doctorId: string | null) => {
    setSelectedDoctor(doctorId);
    if (doctorId) setSelectedBodyPart(null);
  };

  const handleBodyPartSelect = (bodyPartId: string) => {
    setSelectedBodyPart(bodyPartId);
    setSelectedDoctor(null);
  };

  const canAsk = useMemo(
    () =>
      question.trim().length > 3 &&
      !loading &&
      (!!selectedDoctor || !!selectedBodyPart),
    [question, loading, selectedDoctor, selectedBodyPart]
  );

  const selectedDoctorName = doctors.find(
    (d) => d.id === selectedDoctor
  )?.name;

  const ask = useCallback(async () => {
    if (!canAsk) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await queryRAG({
        question: question.trim(),
        actor: mode,
        doctor_id: selectedDoctor,
        body_part: selectedBodyPart,
      });
      setData(result);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [question, mode, canAsk, selectedDoctor, selectedBodyPart]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>CareGuide</Text>
            <Text style={styles.appTagline}>AI-Powered Orthopedic Intelligence</Text>
          </View>
        </View>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Disclaimer mode={mode} />

          {/* Selection Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Get Started</Text>
              <Text style={styles.cardSubtitle}>
                Select a surgeon or body part to begin
              </Text>
            </View>

            <DoctorPicker
              doctors={doctors}
              selectedDoctorId={selectedDoctor}
              onSelect={handleDoctorSelect}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <BodyPartGrid
              bodyParts={BODY_PARTS}
              selectedBodyPartId={selectedBodyPart}
              onSelect={handleBodyPartSelect}
            />
          </View>

          {/* Question Input Card */}
          <View style={styles.card}>
            <View style={styles.questionHeader}>
              <View style={styles.questionIcon}>
                <Ionicons
                  name="help-circle"
                  size={20}
                  color={colors.white}
                />
              </View>
              <Text style={styles.questionTitle}>Ask Your Question</Text>
            </View>

            <TextInput
              style={[
                styles.questionInput,
                (!selectedDoctor && !selectedBodyPart) && styles.inputDisabled,
              ]}
              placeholder={
                selectedDoctorName
                  ? `Ask about ${selectedDoctorName}'s protocols...`
                  : selectedBodyPart
                  ? `Ask about ${BODY_PARTS.find((b) => b.id === selectedBodyPart)?.name.toLowerCase()} care...`
                  : "Select a surgeon or body part first"
              }
              placeholderTextColor={colors.slate400}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!!selectedDoctor || !!selectedBodyPart}
            />

            <TouchableOpacity
              disabled={!canAsk}
              onPress={ask}
              style={[styles.askButton, !canAsk && styles.askButtonDisabled]}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.askButtonText}>Analyzing...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Ionicons name="search" size={20} color={colors.white} />
                  <Text style={styles.askButtonText}>Get Evidence-Based Answer</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle"
                size={20}
                color={colors.red400}
              />
              <View style={styles.errorTextContainer}>
                <Text style={styles.errorTitle}>Error</Text>
                <Text style={styles.errorMessage}>{error}</Text>
              </View>
            </View>
          )}

          {/* Answer */}
          {data && (
            <AnswerCard
              mode={mode}
              data={data}
              doctorName={selectedDoctorName}
              onFollowUp={(q) => setQuestion(q)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteAlpha10,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cyan600,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.white,
    fontSize: fontSize.xxl,
    fontWeight: "900",
  },
  appTitle: {
    fontSize: fontSize.xl,
    fontWeight: "900",
    color: colors.cyan400,
  },
  appTagline: {
    fontSize: fontSize.xs,
    color: colors.cyan400,
    opacity: 0.7,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.whiteAlpha10,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  cardHeader: {
    alignItems: "center",
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.white,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.slate400,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.whiteAlpha20,
  },
  dividerText: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.slate400,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  questionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.blue500,
    alignItems: "center",
    justifyContent: "center",
  },
  questionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  questionInput: {
    backgroundColor: colors.whiteAlpha10,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.whiteAlpha20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: fontSize.md,
    color: colors.white,
    minHeight: 100,
  },
  inputDisabled: {
    opacity: 0.3,
  },
  askButton: {
    backgroundColor: colors.cyan600,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  askButtonDisabled: {
    backgroundColor: colors.whiteAlpha05,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  askButtonText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  errorContainer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.redAlpha20,
    borderWidth: 2,
    borderColor: "rgba(239, 68, 68, 0.5)",
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.red300,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    fontSize: fontSize.sm,
    color: "rgba(252, 165, 165, 0.8)",
  },
});
