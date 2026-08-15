import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useCreateExercise, useExercises } from '@/hooks/useExercises';
import { useAddExerciseToRoutine, useRoutine } from '@/hooks/useRoutines';
import { useActiveSession, useAddExerciseToSession } from '@/hooks/useWorkoutSession';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Equipment, MuscleGroup } from '@/types/models';
import { EQUIPMENT_LABEL, MUSCLE_GROUP_LABEL } from '@/types/models';
import { Constants } from '@/types/database';

const MUSCLE_GROUPS = Constants.public.Enums.muscle_group;
const EQUIPMENT = Constants.public.Enums.equipment;

/**
 * Exercise picker.
 *
 * The screen performs the insert itself rather than handing a selection back
 * to its caller: routing data backwards between screens in expo-router means
 * either params or a shared store, and both are more moving parts than just
 * telling the picker what it is picking for.
 */
export default function ExercisePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string; routineId?: string }>();
  const isRoutineTarget = params.target === 'routine' && Boolean(params.routineId);

  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: exercises, isLoading } = useExercises({ search, muscleGroup, equipment });
  const { data: session } = useActiveSession();
  const { data: routine } = useRoutine(isRoutineTarget ? params.routineId : undefined);

  const addToSession = useAddExerciseToSession();
  const addToRoutine = useAddExerciseToRoutine();

  const busy = addToSession.isPending || addToRoutine.isPending;

  function handleSelect(exerciseId: string) {
    if (busy) return;

    if (isRoutineTarget && params.routineId) {
      addToRoutine.mutate(
        {
          routineId: params.routineId,
          exerciseId,
          position: routine?.routine_exercises.length ?? 0,
        },
        { onSuccess: () => router.back() },
      );
      return;
    }

    if (!session) return;
    addToSession.mutate(
      {
        sessionId: session.id,
        exerciseId,
        position: session.session_exercises.length,
      },
      { onSuccess: () => router.back() },
    );
  }

  if (creating) {
    return <CreateExerciseForm onCancel={() => setCreating(false)} onCreated={handleSelect} />;
  }

  return (
    <Screen
      title="Añadir ejercicio"
      subtitle={isRoutineTarget ? routine?.name : session?.name}
      right={
        <Pressable onPress={() => router.back()} accessibilityLabel="Cerrar" style={styles.close}>
          <Ionicons name="close" size={24} color={colors.textMuted} />
        </Pressable>
      }
    >
      <View style={styles.controls}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar ejercicio…"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            label="Todos"
            active={muscleGroup === null}
            onPress={() => setMuscleGroup(null)}
          />
          {MUSCLE_GROUPS.map((group) => (
            <Chip
              key={group}
              label={MUSCLE_GROUP_LABEL[group]}
              active={muscleGroup === group}
              onPress={() => setMuscleGroup(muscleGroup === group ? null : group)}
            />
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip label="Cualquiera" active={equipment === null} onPress={() => setEquipment(null)} />
          {EQUIPMENT.map((item) => (
            <Chip
              key={item}
              label={EQUIPMENT_LABEL[item]}
              active={equipment === item}
              onPress={() => setEquipment(equipment === item ? null : item)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="Sin resultados"
              message={
                search
                  ? `No hay ningún ejercicio que coincida con "${search}".`
                  : 'No hay ejercicios con esos filtros.'
              }
              actionLabel="Crear ejercicio"
              onAction={() => setCreating(true)}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item.id)}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowMeta}>
                  {MUSCLE_GROUP_LABEL[item.muscle_group as MuscleGroup]} ·{' '}
                  {EQUIPMENT_LABEL[item.equipment as Equipment]}
                </Text>
              </View>
              {item.is_custom ? <Text style={styles.customBadge}>Tuyo</Text> : null}
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
            </Pressable>
          )}
        />
      )}

      <View style={styles.footer}>
        <Button
          label="Crear ejercicio propio"
          variant="secondary"
          onPress={() => setCreating(true)}
        />
      </View>
    </Screen>
  );
}

function CreateExerciseForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (exerciseId: string) => void;
}) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('chest');
  const [equipment, setEquipment] = useState<Equipment>('barbell');
  const [error, setError] = useState<string | null>(null);
  const createExercise = useCreateExercise();

  function handleCreate() {
    setError(null);
    createExercise.mutate(
      { name, muscleGroup, equipment },
      {
        onSuccess: (exercise) => onCreated(exercise.id),
        onError: (e) => setError(e instanceof Error ? e.message : 'No se pudo crear.'),
      },
    );
  }

  return (
    <Screen title="Nuevo ejercicio">
      <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <Input
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Press inclinado en multipower"
          autoFocus
        />

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Grupo muscular</Text>
          <View style={styles.wrap}>
            {MUSCLE_GROUPS.map((group) => (
              <Chip
                key={group}
                label={MUSCLE_GROUP_LABEL[group]}
                active={muscleGroup === group}
                onPress={() => setMuscleGroup(group)}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Material</Text>
          <View style={styles.wrap}>
            {EQUIPMENT.map((item) => (
              <Chip
                key={item}
                label={EQUIPMENT_LABEL[item]}
                active={equipment === item}
                onPress={() => setEquipment(item)}
              />
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Crear y añadir"
          size="lg"
          onPress={handleCreate}
          disabled={name.trim().length === 0}
          loading={createExercise.isPending}
        />
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      </ScrollView>
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  chipRow: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  chipLabelActive: {
    color: colors.primary,
  },
  loader: {
    marginTop: spacing.xl,
  },
  list: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    ...typography.body,
    color: colors.text,
  },
  rowMeta: {
    ...typography.caption,
    color: colors.textFaint,
  },
  customBadge: {
    ...typography.caption,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  footer: {
    paddingVertical: spacing.md,
  },
  formContent: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  formGroup: {
    gap: spacing.sm,
  },
  formLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  error: {
    ...typography.body,
    color: colors.danger,
  },
});
