export default function ErrorMessage({ error }: { error: string }) {
  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
      <p className="text-sm text-destructive">{error}</p>
    </div>
  );
}
