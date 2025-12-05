import { createContext, useContext, useEffect, useState } from "react";

export const CurrentTimeContext = createContext<{
  currentTime: Date;
  setCurrentTime: (currentTime: Date) => void;
}>(null!);

export const CurrentTimeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CurrentTimeContext.Provider value={{ currentTime, setCurrentTime }}>
      {children}
    </CurrentTimeContext.Provider>
  );
};

export const useCurrentTime = () => {
  return useContext(CurrentTimeContext);
};
