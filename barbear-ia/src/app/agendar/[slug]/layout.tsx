export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 w-full">{children}</main>
      <footer className="py-6 text-center text-xs text-slate-400">
        Agendamento via{' '}
        <span className="font-semibold text-brand">Barbear.IA</span>
      </footer>
    </div>
  )
}
