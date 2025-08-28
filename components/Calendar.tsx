'use client';

import React, { useState, useMemo } from 'react';
import { Schedule } from '../types';
import styles from './Calendar.module.css';

interface CalendarProps {
  schedules: Schedule[];
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
}

export function Calendar({ schedules, onDateClick, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { calendarDays, monthYear } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 월의 첫 번째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 달력 시작일 (이전 달의 마지막 주 포함)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // 달력 종료일 (다음 달의 첫 주 포함)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const daySchedules = schedules.filter(schedule => schedule.date === dateStr);
      
      days.push({
        date: new Date(current),
        hasSchedule: daySchedules.length > 0,
        schedules: daySchedules,
        isToday: current.toDateString() === new Date().toDateString(),
        isCurrentMonth: current.getMonth() === month,
        isSelected: selectedDate && current.toDateString() === selectedDate.toDateString()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return {
      calendarDays: days,
      monthYear: `${year}년 ${month + 1}월`
    };
  }, [currentDate, schedules, selectedDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button 
          className={styles.navButton} 
          onClick={goToPreviousMonth}
          aria-label="이전 달"
        >
          ‹
        </button>
        
        <div className={styles.monthYear}>
          <h3>{monthYear}</h3>
          <button 
            className={styles.todayButton} 
            onClick={goToToday}
          >
            오늘
          </button>
        </div>
        
        <button 
          className={styles.navButton} 
          onClick={goToNextMonth}
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className={styles.weekDays}>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              ${styles.calendarDay}
              ${day.isToday ? styles.today : ''}
              ${day.hasSchedule ? styles.hasSchedule : ''}
              ${!day.isCurrentMonth ? styles.otherMonth : ''}
              ${day.isSelected ? styles.selected : ''}
            `}
            onClick={() => handleDateClick(day.date)}
          >
            <span className={styles.dayNumber}>
              {day.date.getDate()}
            </span>
            
            {day.hasSchedule && (
              <div className={styles.scheduleIndicator}>
                <div className={styles.scheduleDot}></div>
                <div className={styles.scheduleTooltip}>
                  {day.schedules.map(schedule => (
                    <div key={schedule.id} className={styles.scheduleItem}>
                      <strong>{schedule.time}</strong> {schedule.location}
                      {schedule.description && (
                        <div className={styles.scheduleDescription}>
                          {schedule.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDate && (
        <div className={styles.selectedDateInfo}>
          <h4>{selectedDate.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}</h4>
          {schedules
            .filter(schedule => schedule.date === selectedDate.toISOString().split('T')[0])
            .map(schedule => (
              <div key={schedule.id} className={styles.selectedSchedule}>
                <span className={styles.scheduleTime}>{schedule.time}</span>
                <span className={styles.scheduleLocation}>{schedule.location}</span>
                {schedule.description && (
                  <div className={styles.scheduleDescription}>
                    {schedule.description}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}