import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { RirPicker } from '@/components/workout/RirPicker';
import { formatWeightValue } from '@/lib/units';
import { MIN_TOUCH, colors, radius, rirColor, spacing, typography } from '@/theme/tokens';
import type { WeightUnit } from '@/types/models';

type Props = {
  setNumber: number;
  weight: string;
  reps: string;
  rir: number | null;
  /** What the user did on this set last time, shown as ghost text. */
  weightPlaceholder: number | null;
  repsPlaceholder: number | null;
  unit: WeightUnit;
  completed: boolean;
  saving?: boolean;
  onChangeWeight: (value: string) => void;
  onChangeReps: (value: string) => void;
  onChangeRir: (value: number | null) => void;
  onComplete: () => void;
  onReopen: () => void;
  onDelete: () => void;
};

export function SetRow({
  setNumber,
  weight,
  reps,
  rir,
  weightPlaceholder,
  repsPlaceholder,
  unit,
  completed,
  saving = false,
  onChangeWeight,
  onChangeReps,
  onChangeRir,
  onComplete,
  onReopen,
  onDelete,
}: Props) {
  // A set needs reps to mean anything. Weight is optional so bodyweight work
  // (pull-ups, planks) can be logged without inventing a number.
  const canComplete = reps.trim().length > 0;

  if (completed) {
    return (
      <Pressable
        onPress={onReopen}
        onLongPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={`Serie ${setNumber} completada. Tocar para editar.`}
        style={({ pressed }) => [styles.doneRow, pressed && styles.doneRowPressed]}
      >
        <View style={styles.doneBadge}>
          <Ionicons name="checkmark" size={14} color={colors.success} />
        </View>
        <Text style={styles.doneNumber}>{setNumber}</Text>
        <Text style={styles.doneValue}>
          {weight ? `${formatWeightValue(Number(weight.replace(',', '.')))} ${unit}` : 'Sin peso'}
          {reps ? ` × ${reps}` : ''}
        </Text>
        {rir != null ? (
          <Text style={[styles.doneRir, { color: rirColor(rir) }]}>RIR {rir}</Text>
        ) : (
          <Text style={styles.doneRirEmpty}>—</Text>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.editRow}>
      <View style={styles.topLine}>
        <Text style={styles.number}>{setNumber}</Text>

        <View style={styles.field}>
          <TextInput
            value={weight}
            onChangeText={onChangeWeight}
            placeholder={weightPlaceholder != null ? formatWeightValue(weightPlaceholder) : unit}
            placeholderTextColor={colors.textFaint}
            keyboardType="decimal-pad"
            inputMode="decimal"
            keyboardAppearance="dark"
            style={styles.input}
            accessibilityLabel={`Peso de la serie ${setNumber}`}
            selectTextOnFocus
          />
          <Text style={styles.unit}>{unit}</Text>
        </View>

        <Text style={styles.times}>×</Text>

        <View style={styles.field}>
          <TextInput
            value={reps}
            onChangeText={onChangeReps}
            placeholder={repsPlaceholder != null ? String(repsPlaceholder) : 'reps'}
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            inputMode="numeric"
            keyboardAppearance="dark"
            style={styles.input}
            accessibilityLabel={`Repeticiones de la serie ${setNumber}`}
            selectTextOnFocus
          />
        </View>

        <Pressable
          onPress={onComplete}
          disabled={!canComplete || saving}
          accessibilityRole="button"
          accessibilityLabel={`Completar serie ${setNumber}`}
          style={({ pressed }) => [
            styles.check,
            canComplete && styles.checkReady,
            pressed && styles.checkPressed,
            (!canComplete || saving) && styles.checkDisabled,
          ]}
        >
          <Ionicons
            name="checkmark"
            size={22}
            color={canComplete ? colors.textOnPrimary : colors.textFaint}
          />
        </Pressable>
      </View>

      <View style={styles.bottomLine}>
        <Text style={styles.rirLabel}>RIR</Text>
        <RirPicker value={rir} onChange={onChangeRir} compact />
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar serie ${setNumber}`}
          style={styles.delete}
        >
          <Ionicons name="close" size={18} color={colors.textFaint} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editRow: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  number: {
    ...typography.bodyStrong,
    color: colors.textFaint,
    width: 18,
    textAlign: 'center',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    height: MIN_TOUCH,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.numeric,
    paddingVertical: 0,
  },
  unit: {
    ...typography.caption,
    color: colors.textFaint,
  },
  times: {
    ...typography.body,
    color: colors.textFaint,
  },
  check: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  checkReady: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkPressed: {
    opacity: 0.7,
  },
  checkDisabled: {
    opacity: 0.5,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 26,
  },
  rirLabel: {
    ...typography.caption,
    color: colors.textFaint,
    width: 26,
  },
  delete: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  doneRowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  doneBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneNumber: {
    ...typography.caption,
    color: colors.textFaint,
    width: 14,
  },
  doneValue: {
    ...typography.numeric,
    color: colors.text,
    flex: 1,
  },
  doneRir: {
    ...typography.label,
    fontWeight: '600',
  },
  doneRirEmpty: {
    ...typography.label,
    color: colors.textFaint,
  },
});
