import { differenceInSeconds } from "date-fns";

export const duration = (earlierDate: Date, laterDate: Date) => {
  const difference = differenceInSeconds(laterDate, earlierDate);
  const hours = Math.floor(difference / 3600);
  const minutes = Math.floor((difference % 3600) / 60);
  const seconds = difference % 60;
  return `${hours > 0 ? `${hours.toString().padStart(2, "0")}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};
