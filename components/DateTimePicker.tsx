import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from './Button';

interface DateTimePickerProps {
  value: Date;
  onChange: (value: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  nullable?: boolean;
  onClear?: () => void;
}

export function DateTimePicker({ value, onChange, mode = 'datetime', nullable = false, onClear }: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [selectedTime, setSelectedTime] = useState({
    hour: (value?.getHours() || 0).toString().padStart(2, '0'),
    minute: (value?.getMinutes() || 0).toString().padStart(2, '0'),
  });

  const openPicker = () => {
    const dateToUse = value || new Date();
    setSelectedDate(dateToUse);
    setCurrentMonth(dateToUse);
    setSelectedTime({
      hour: dateToUse.getHours().toString().padStart(2, '0'),
      minute: dateToUse.getMinutes().toString().padStart(2, '0'),
    });
    setShowPicker(true);
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(parseInt(selectedTime.hour));
    newDate.setMinutes(parseInt(selectedTime.minute));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    onChange(newDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const handleRemove = () => {
    if (onClear) {
      onClear();
    }
    setShowPicker(false);
  };

  const formatDisplayValue = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const isSelectedDay = (day: number | null) => {
    if (!day || !selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getFullYear() === currentMonth.getFullYear()
    );
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const selectDay = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={openPicker}>
        <Calendar size={20} color={Colors.textSecondary} />
        <Text style={styles.inputText}>
          {formatDisplayValue(value)}
        </Text>
        {nullable && value && onClear && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <X size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
                <ChevronLeft size={24} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthYear}>{monthYear}</Text>
              <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                <ChevronRight size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarContainer}>
              <View style={styles.weekDays}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <Text key={day} style={styles.weekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {calendarDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      !day && styles.emptyCell,
                      isSelectedDay(day) && styles.selectedDay,
                      isToday(day) && !isSelectedDay(day) && styles.todayCell,
                    ]}
                    onPress={() => day && selectDay(day)}
                    disabled={!day}
                  >
                    {day && (
                      <Text
                        style={[
                          styles.dayText,
                          isSelectedDay(day) && styles.selectedDayText,
                          isToday(day) && !isSelectedDay(day) && styles.todayText,
                        ]}
                      >
                        {day}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.timePicker}>
              <Text style={styles.timeLabel}>Time</Text>
              <View style={styles.timeSelectors}>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {hours.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedTime.hour === hour && styles.selectedTimeOption,
                      ]}
                      onPress={() => setSelectedTime({ ...selectedTime, hour })}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedTime.hour === hour && styles.selectedTimeText,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.timeSeparator}>:</Text>

                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {minutes.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.timeOption,
                        selectedTime.minute === minute && styles.selectedTimeOption,
                      ]}
                      onPress={() => setSelectedTime({ ...selectedTime, minute })}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selectedTime.minute === minute && styles.selectedTimeText,
                        ]}
                      >
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              {nullable && onClear && (
                <TouchableOpacity onPress={handleRemove}>
                  <Text style={styles.removeText}>Clear</Text>
                </TouchableOpacity>
              )}
              <View style={styles.actionButtons}>
                <Button title="Cancel" onPress={handleCancel} variant="secondary" />
                <Button title="Done" onPress={handleConfirm} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  inputText: {
    flex: 1,
    ...Typography.body,
    color: Colors.white,
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  calendarContainer: {
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  selectedDay: {
    backgroundColor: '#000000',
    borderRadius: BorderRadius.md,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: BorderRadius.md,
  },
  dayText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayText: {
    fontWeight: '600',
  },
  timePicker: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: Spacing.sm,
  },
  timeSelectors: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeScroll: {
    flex: 1,
    maxHeight: 120,
  },
  timeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  selectedTimeOption: {
    backgroundColor: '#F0F0F0',
  },
  timeText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedTimeText: {
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  removeText: {
    fontSize: 14,
    color: '#999999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
