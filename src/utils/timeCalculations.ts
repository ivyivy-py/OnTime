/**
 * @file timeCalculations.ts
 * Real-time Singapore commuter pacing and arrival time calculation engine.
 * 
 * Core rule:
 * To determine if the user will be late:
 * Look at the current time and the total time needed.
 * If (current time + total time needed) exceeds the time the user wants to arrive,
 * the user will be late!
 */

/**
 * Parses a time string (e.g., "09:00", "9:00 AM", "18:30", "6:30 PM") into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 9 * 60; // default 09:00 (540 mins)
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes('pm');
  const isAM = clean.includes('am');

  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9 * 60;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight into 12-hour format string (e.g. "9:18 AM").
 */
export function formatMinutesToTime(minutesSinceMidnight: number): string {
  const normalized = ((minutesSinceMidnight % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Returns a smart default "arrive by" time in HH:MM format for <input type="time">.
 * If morning (before 9:00 AM), defaults to "09:00".
 * Otherwise, rounds (current time + 45 minutes) to the next 5-minute mark.
 */
export function getDefaultTargetTime(baseDate: Date = new Date()): string {
  const h = baseDate.getHours();
  const m = baseDate.getMinutes();

  if (h < 9 || (h === 9 && m === 0)) {
    return '09:00';
  }

  // Next target: current time + 45 minutes, rounded to nearest 5 mins
  const targetTotal = h * 60 + m + 45;
  const rounded = Math.ceil(targetTotal / 5) * 5;
  const targetH = Math.floor(rounded / 60) % 24;
  const targetM = rounded % 60;

  return `${targetH.toString().padStart(2, '0')}:${targetM.toString().padStart(2, '0')}`;
}

export interface PacingCalculation {
  currentTimeFormatted: string;
  totalDurationMin: number;
  estReachTimeFormatted: string;
  targetTimeFormatted: string;
  isLate: boolean;
  lateMinutes: number;
  bufferMinutes: number;
  statusLabel: string;
}

/**
 * Determines if the user will be late by comparing:
 * (current time + total time needed) vs (time user wants to arrive).
 * 
 * @param totalTimeNeededMin - Total transit duration in minutes
 * @param targetArrivalTimeStr - Time user wants to arrive (e.g. "09:00" or "9:00 AM")
 * @param baseDate - Current clock timestamp
 */
export function determinePacingStatus(
  totalTimeNeededMin: number,
  targetArrivalTimeStr: string,
  baseDate: Date = new Date()
): PacingCalculation {
  const currentMinutes = baseDate.getHours() * 60 + baseDate.getMinutes();
  const estimatedReachMinutes = currentMinutes + totalTimeNeededMin;
  const targetMinutes = parseTimeToMinutes(targetArrivalTimeStr);

  const diffMinutes = targetMinutes - estimatedReachMinutes;
  const isLate = diffMinutes < 0;
  const lateMinutes = isLate ? Math.abs(diffMinutes) : 0;
  const bufferMinutes = !isLate ? diffMinutes : 0;

  return {
    currentTimeFormatted: formatMinutesToTime(currentMinutes),
    totalDurationMin: totalTimeNeededMin,
    estReachTimeFormatted: formatMinutesToTime(estimatedReachMinutes),
    targetTimeFormatted: formatMinutesToTime(targetMinutes),
    isLate,
    lateMinutes,
    bufferMinutes,
    statusLabel: isLate ? `Late by ${lateMinutes} min` : `+${bufferMinutes}m buffer`
  };
}
