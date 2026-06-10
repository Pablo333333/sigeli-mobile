import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimelineItemProps {
  status: string;
  date: string;
  notes: string;
  isLast: boolean;
  isFirst: boolean;
  isCompleted: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ 
  status, 
  date, 
  notes, 
  isLast, 
  isFirst,
  isCompleted 
}) => {
  const formattedDate = new Date(date).toLocaleDateString();

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View style={[
          styles.circle, 
          isCompleted ? styles.circleCompleted : styles.circlePending
        ]} />
        {!isLast && <View style={styles.line} />}
      </View>
      
      <View style={styles.rightColumn}>
        <Text style={[styles.status, isCompleted && styles.statusCompleted]}>
          {status.replace('_', ' ')}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
        {notes && <Text style={styles.notes}>{notes}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 80,
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
  },
  circleCompleted: {
    backgroundColor: '#4CAF50',
  },
  circlePending: {
    backgroundColor: '#CBD5E0',
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: -2,
  },
  rightColumn: {
    flex: 1,
    paddingBottom: 20,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A5568',
  },
  statusCompleted: {
    color: '#2D3748',
  },
  date: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
  notes: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
