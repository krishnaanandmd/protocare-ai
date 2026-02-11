import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Doctor } from "../types";
import { colors, borderRadius, spacing, fontSize } from "../theme";

type Props = {
  doctors: Doctor[];
  selectedDoctorId: string | null;
  onSelect: (doctorId: string | null) => void;
};

export function DoctorPicker({ doctors, selectedDoctorId, onSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const filteredDoctors = useMemo(() => {
    if (!searchTerm) return doctors;
    const lower = searchTerm.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.specialty.toLowerCase().includes(lower)
    );
  }, [doctors, searchTerm]);

  const handleSelect = (doctor: Doctor) => {
    setSearchTerm(doctor.name);
    onSelect(doctor.id);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSelect(null);
    setIsOpen(false);
  };

  const handleChangeText = (text: string) => {
    setSearchTerm(text);
    setIsOpen(true);
    if (!text && selectedDoctorId) {
      onSelect(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Ionicons name="person" size={20} color={colors.white} />
        </View>
        <Text style={styles.sectionTitle}>Find Your Surgeon</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="search"
          size={18}
          color={colors.slate400}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Search for your surgeon..."
          placeholderTextColor={colors.slate400}
          value={searchTerm}
          onChangeText={handleChangeText}
          onFocus={() => setIsOpen(true)}
          autoCorrect={false}
        />
        {(searchTerm.length > 0 || selectedDoctorId) && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.slate400} />
          </TouchableOpacity>
        )}
      </View>

      {isOpen && filteredDoctors.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={filteredDoctors}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={[
                  styles.dropdownItem,
                  index < filteredDoctors.length - 1 && styles.dropdownItemBorder,
                  item.id === selectedDoctorId && styles.selectedItem,
                ]}
              >
                <Text style={styles.doctorName}>{item.name}</Text>
                <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {isOpen && searchTerm.length > 0 && filteredDoctors.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>
            No surgeons found matching "{searchTerm}"
          </Text>
        </View>
      )}

      {selectedDoctor && !isOpen && (
        <View style={styles.selectedBanner}>
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={colors.emerald400}
          />
          <Text style={styles.selectedText}>
            Connected to{" "}
            <Text style={styles.selectedName}>{selectedDoctor.name}</Text>'s
            protocols
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
    backgroundColor: colors.cyan600,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteAlpha10,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.whiteAlpha20,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    fontSize: fontSize.lg,
    color: colors.white,
  },
  clearButton: {
    padding: spacing.xs,
  },
  dropdown: {
    backgroundColor: colors.slate900,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.whiteAlpha20,
    overflow: "hidden",
  },
  list: {
    maxHeight: 280,
  },
  dropdownItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteAlpha10,
  },
  selectedItem: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  doctorName: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.white,
  },
  doctorSpecialty: {
    fontSize: fontSize.sm,
    color: colors.slate400,
    marginTop: 2,
  },
  noResults: {
    backgroundColor: colors.slate900,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.whiteAlpha20,
    padding: spacing.lg,
  },
  noResultsText: {
    fontSize: fontSize.sm,
    color: colors.slate400,
    textAlign: "center",
  },
  selectedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cyanAlpha20,
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
