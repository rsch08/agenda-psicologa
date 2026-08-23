export default function WelcomeMessage() {
  return (
    <div className="bg-white rounded-xl shadow p-5 mb-6">
      <h2 className="text-lg font-semibold mb-2">Bienvenido/a</h2>
      <p className="text-sm text-slate-600 mb-3">
        En nuestra primera sesión vamos a conocernos y a conocer un poco más sobre lo que te
        trae a este espacio.
      </p>
      <p className="text-sm font-medium text-slate-700 mb-1">Hablaremos sobre:</p>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5 mb-3">
        <li>Qué te gustaría trabajar.</li>
        <li>Qué expectativas tienes del proceso.</li>
        <li>Cómo trabajo y qué puedes esperar de mí.</li>
        <li>Los acuerdos y reglas que cuidaremos en este espacio.</li>
        <li>Cómo serán las siguientes sesiones.</li>
      </ul>
      <p className="text-sm text-slate-600">
        No necesitas llegar con todo claro. La primera sesión también es un espacio para
        empezar a construir juntos por dónde comenzar.
      </p>
    </div>
  )
}
