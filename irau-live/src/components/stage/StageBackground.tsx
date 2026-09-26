import { GeometricPattern } from '../brand/GeometricPattern';

/** Layered, slow-moving backdrop: deep navy, soft light, geometric lattice, film grain. */
export function StageBackground({ warm = false }: { warm?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="stage-bg absolute inset-0" />
      <div
        className="absolute inset-0"
        style={{ maskImage: 'radial-gradient(1100px 900px at 85% 30%, black 0%, transparent 75%)', WebkitMaskImage: 'radial-gradient(1100px 900px at 85% 30%, black 0%, transparent 75%)' }}
      >
        <GeometricPattern opacity={0.07} tile={132} />
      </div>
      <div className="motion-decor anim-drift absolute -left-40 top-40 h-[720px] w-[720px] rounded-full bg-brand/20 blur-[140px]" />
      <div className="motion-decor anim-drift absolute -right-20 bottom-[-200px] h-[640px] w-[640px] rounded-full bg-teal/12 blur-[150px]" style={{ animationDelay: '-14s' }} />
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{ opacity: warm ? 1 : 0, background: 'radial-gradient(900px 600px at 30% 50%, color-mix(in oklab, var(--color-gold) 18%, transparent), transparent 70%)' }}
      />
      <div className="stage-grain absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/30 to-transparent" />
    </div>
  );
}
