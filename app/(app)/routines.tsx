import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useCreateRoutine, useDeleteRoutine, useRoutines } from '@/hooks/useRoutines';
import { pluralise } from '@/lib/format';
import { colors, spacing, typography } from '@/theme/tokens';

export default function RoutinesScreen() {
  const router = useRouter();
  const { data: routines, isLoading } = useRoutines();
  const createRoutine = useCreateRoutine();
  const deleteRoutine = useDeleteRoutine();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  function handleCreate() {
    const trimmed = name.trim();
    if (trimmed.length === 0) return;

    createRoutine.mutate(trimmed, {
      onSuccess: (routine) => {
        setName('');
        setCreating(false);
        // Straight into the editor: a routine with no exercises is not useful,
        // so the next step is always adding them.
        router.push({ pathname: '/routine/[id]', params: { id: routine.id } });
      },
    });
  }

  if (isLoading) {
    return (
      <Screen title="Rutinas">
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen title="Rutinas" subtitle="Tus plantillas de entreno">
      {creating ? (
        <View style={styles.createBox}>
          <Input
            label="Nombre de la rutina"
            value={name}
            onChangeText={setName}
            placeholder="Empuje A, Pierna, Full body…"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <View style={styles.createActions}>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={() => {
                setCreating(false);
                setName('');
              }}
            />
            <Button
              label="Crear"
              onPress={handleCreate}
              disabled={name.trim().length === 0}
              loading={createRoutine.isPending}
            />
          </View>
        </View>
      ) : (
        <Button
          label="Nueva rutina"
          icon={<Ionicons name="add" size={20} color={colors.textOnPrimary} />}
          onPress={() => setCreating(true)}
          style={styles.newButton}
        />
      )}

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Sin rutinas todavía"
            message="Una rutina guarda los ejercicios que sueles hacer juntos, con sus series y su RIR objetivo."
            actionLabel="Crear la primera"
            onAction={() => setCreating(true)}
          />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => router.push({ pathname: '/routine/[id]', params: { id: item.id } })}
          >
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {pluralise(item.routine_exercises.length, 'ejercicio', 'ejercicios')}
                {item.routine_exercises.length > 0
                  ? ` · ${item.routine_exercises.slice(0, 3).map((re) => re.exercise.name).join(', ')}`
                  : ''}
              </Text>
            </View>
            <Ionicons
              name="trash-outline"
              size={20}
              color={colors.textFaint}
              onPress={() =>
                Alert.alert('Eliminar rutina', `Se eliminará "${item.name}". Tus entrenos ya hechos no se tocan.`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => deleteRoutine.mutate(item.id),
                  },
                ])
              }
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing.xl,
  },
  newButton: {
    marginTop: spacing.sm,
  },
  createBox: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  list: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textFaint,
  },
});
