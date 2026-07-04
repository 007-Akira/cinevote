import { GlassCard } from "@/components/ui/GlassCard";

export function ScreeningInfoCard() {
  return (
    <GlassCard className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase text-cine-text-muted">
          Screening info
        </p>
        <span className="rounded-full border border-cine-red/40 bg-cine-red/10 px-3 py-1 text-xs font-semibold text-cine-text-secondary">
          Coming Soon
        </span>
      </div>
      <p className="text-base leading-7 text-cine-text-secondary">
        Screening date coming soon. Stay tuned for the final announcement.
      </p>
    </GlassCard>
  );
}
