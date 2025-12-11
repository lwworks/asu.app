import { cn } from "@/lib/cn";

export const Icon = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 161 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("fill-current", className)}
    >
      <path d="M32.1268 96H0V64H32.1268V96Z" />
      <path d="M96.3804 96H64.2536V64H96.3804V96Z" />
      <path d="M160.634 96H128.507V64H160.634V96Z" />
      <path d="M64.2536 64H32.1268V32H64.2536V64Z" />
      <path d="M128.507 64H96.3804V32H128.507V64Z" />
      <path d="M96.3804 32H64.2536V0H96.3804V32Z" />
      <path d="M160.634 32H128.507V0H160.634V32Z" />
    </svg>
  );
};
