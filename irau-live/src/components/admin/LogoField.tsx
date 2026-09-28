import { useId, useRef, useState } from 'react';
import { useStore } from '../../state/StoreContext';
import { prepareLogo } from '../../utils/image';
import { Button } from '../ui/primitives';
import { Icon } from '../ui/Icon';

/**
 * Upload / replace / remove a logo. Previews on the stage background (or a
 * white plate for partner logos) so you see exactly how it will look.
 */
export function LogoField({ label, value, onChange, hint, knockout = false, plate = false }: { label: string; value: string; onChange: (url: string) => void; hint?: string; knockout?: boolean; plate?: boolean }) {
  const store = useStore();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange(await store.storeAsset(await prepareLogo(file)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <p id={id} className="mb-1.5 text-sm font-semibold text-slate-700">
        {label}
      </p>
      <div
        className="grid h-28 place-items-center rounded-2xl p-4 ring-1 ring-inset ring-slate-200"
        style={{ background: plate ? '#ffffff' : 'var(--color-ink)' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void pick(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <img src={value} alt={label} className="max-h-20 max-w-full object-contain" style={{ filter: knockout ? 'brightness(0) invert(1)' : undefined }} />
        ) : (
          <span className={plate ? 'text-sm text-slate-400' : 'text-sm text-white/50'}>Drop an image here</span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => input.current?.click()} disabled={busy} aria-describedby={id}>
          <Icon name="upload" className="h-4 w-4" /> {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
        </Button>
        {value && (
          <Button size="sm" variant="danger" onClick={() => onChange('')}>
            Remove
          </Button>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {hint && <p className="mt-2 text-[13px] leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}
