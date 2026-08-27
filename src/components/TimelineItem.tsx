import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme';

interface TimelineItemProps {
  status: string;
  date?: string;
  notes?: string;
  subStatus?: string;
  isLast: boolean;
  state: 'completed' | 'current' | 'pending' | 'rejected' | 'skipped';
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  status,
  date,
  notes,
  subStatus,
  isLast,
  state,
}) => {
  const formattedDate = date ? new Date(date).toLocaleDateString() : null;
  const isCompleted = state === 'completed';
  const isCurrent = state === 'current';
  const isRejected = state === 'rejected';

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View
          style={[
            styles.circle,
            isCompleted && styles.circleCompleted,
            isCurrent && styles.circleCurrent,
            isRejected && styles.circleRejected,
            state === 'pending' && styles.circlePending,
            state === 'skipped' && styles.circleSkipped,
          ]}
        />
        {!isLast && (
          <View
            style={[
              styles.line,
              (isCompleted || isCurrent) && styles.lineActive,
            ]}
          />
        )}
      </View>

      <View style={styles.rightColumn}>
        <Text
          style={[
            styles.status,
            isCompleted && styles.statusCompleted,
            isCurrent && styles.statusCurrent,
            isRejected && styles.statusRejected,
          ]}
        >
          {status}
        </Text>
        {!!subStatus && <Text style={styles.subStatus}>{subStatus}</Text>}
        {!!formattedDate && <Text style={styles.date}>{formattedDate}</Text>}
        {!!notes && <Text style={styles.notes}>{notes}</Text>}
        {isCurrent && <Text style={styles.currentBadge}>Etapa actual</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 72,
  },
  leftColumn: {
    alignItems: 'center',
    width: 30,
    marginRight: 15,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    backgroundColor: '#fff',
  },
  circleCompleted: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  circleCurrent: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
    transform: [{ scale: 1.15 }],
  },
  circleRejected: {
    backgroundColor: Theme.colors.danger,
    borderColor: Theme.colors.danger,
  },
  circlePending: {
    backgroundColor: '#EDF2F7',
    borderColor: '#CBD5E0',
  },
  circleSkipped: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: -2,
  },
  lineActive: {
    backgroundColor: Theme.colors.primary + '55',
  },
  rightColumn: {
    flex: 1,
    paddingBottom: 18,
  },
  status: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A0AEC0',
  },
  statusCompleted: {
    color: '#2D3748',
  },
  statusCurrent: {
    color: Theme.colors.primary,
  },
  statusRejected: {
    color: Theme.colors.danger,
  },
  subStatus: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
  notes: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    fontStyle: 'italic',
  },
  currentBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
