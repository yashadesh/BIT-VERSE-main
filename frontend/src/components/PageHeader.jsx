export default function PageHeader({ chip, title, subtitle, testid }) {
  return (
    <div className="animate-fade-up" data-testid={testid}>
      {chip && <div className="chip mb-4">{chip}</div>}
      <h1 className="section-title text-4xl md:text-6xl font-bold tracking-tighter">{title}</h1>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-[#B0B8C5] max-w-2xl">{subtitle}</p>
      )}
    </div>
  );
}
