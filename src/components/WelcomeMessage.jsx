export default function WelcomeMessage() {
  return (
    <div className="bg-paper-2 border border-line rounded-sm p-5 sm:p-6 mb-6">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-thread">Bienvenido/a</span>
      <p className="text-sm text-ink mt-3 mb-3">
        En nuestra primera sesión vamos a conocernos y a conocer un poco más sobre lo que te
        trae a este espacio.
      </p>
      <p className="text-sm font-medium text-ink mb-1.5">Hablaremos sobre:</p>
      <ul className="space-y-1 mb-3">
        {[
          'Qué te gustaría trabajar.',
          'Qué expectativas tienes del proceso.',
          'Cómo trabajo y qué puedes esperar de mí.',
          'Los acuerdos y reglas que cuidaremos en este espacio.',
          'Cómo serán las siguientes sesiones.',
        ].map((item) => (
          <li key={item} className="flex gap-2 text-sm text-ink">
            <span className="font-mono text-thread">—</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink">
        No necesitas llegar con todo claro. La primera sesión también es un espacio para
        empezar a construir juntos por dónde comenzar.
      </p>
    </div>
  )
}
