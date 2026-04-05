/**
 * Shared card shell with consistent styling, loading skeleton, and error state.
 */

interface CardWrapperProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
}

export function CardWrapper({
  title,
  children,
  className = "",
  isLoading,
  error,
}: CardWrapperProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm ${className}`}
    >
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>

      {isLoading ? (
        <SkeletonContent />
      ) : error ? (
        <ErrorContent message={error} />
      ) : (
        children
      )}
    </div>
  );
}

function SkeletonContent() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
    </div>
  );
}

function ErrorContent({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
      <span className="text-sm text-red-400">⚠</span>
      <span className="text-sm text-red-300">{message}</span>
    </div>
  );
}
