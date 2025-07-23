import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "p-2 bg-primary/10 rounded-full flex items-center justify-center",
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary w-full h-full"
      >
        <path d="M4 14a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1Z" />
        <path d="M8 10V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <path d="M8 10v10" />
        <path d="M16 10v10" />
        <path d="M12 20a4 4 0 0 0 4-4v-4a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v4a4 4 0 0 0 4 4Z" />
      </svg>
    </div>
  );
}
