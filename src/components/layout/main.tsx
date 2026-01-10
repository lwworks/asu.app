import { cn } from "@/lib/cn";

export const Main = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <main className={cn("h-[calc(100vh-6rem)]", className)}>{children}</main>
  );
};
