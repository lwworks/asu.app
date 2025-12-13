import { setHours, setMinutes, setSeconds, subDays } from "date-fns";

export const validateTimeInput = (
  time: string,
  currentTime: Date
): { error?: string; time?: Date } => {
  // Check input format
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (!timeRegex.test(time)) {
    return {
      error: "Format: HH:mm oder HH:mm:ss",
    };
  }
  // Parse the time string
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parts.length === 3 ? parseInt(parts[2], 10) : 0;
  // Create a date with the input time for today
  let resultDate = new Date(currentTime);
  resultDate = setHours(resultDate, hours);
  resultDate = setMinutes(resultDate, minutes);
  resultDate = setSeconds(resultDate, seconds);

  // Check if time should be yesterday
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();
  const inputTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
  const currentTimeInSeconds =
    currentHours * 3600 + currentMinutes * 60 + currentSeconds;
  if (inputTimeInSeconds > currentTimeInSeconds) {
    resultDate = subDays(resultDate, 1);
  }

  return { time: resultDate };
};
