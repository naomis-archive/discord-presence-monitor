/**
 * Parses a start timestamp into HH:MM:SS format.
 *
 * @param {number} time The timestamp to parse.
 * @returns {string} The time elapsed since the timestamp, in HH:MM:SS format.
 */
export const parseTimestamp = (time: number): string => {
  const elapsed = Date.now() - time;
  const totalSeconds = Math.round(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutesRemain = totalSeconds - hours * 3600;
  const minutes = Math.floor(minutesRemain / 60);
  const secondsRemain = minutesRemain - minutes * 60;
  const seconds = Math.floor(secondsRemain);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};
