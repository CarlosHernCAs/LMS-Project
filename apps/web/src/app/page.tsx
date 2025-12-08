export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          🎓 LMS Perú
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Plataforma educativa para colegios del Perú
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Iniciar Sesión
          </a>
          <a
            href="/docs"
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition"
          >
            Documentación
          </a>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">📚 Gestión Académica</h3>
          <p className="text-sm text-muted-foreground">
            Administra cursos, notas y asistencia de forma sencilla.
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">👥 Multi-Institución</h3>
          <p className="text-sm text-muted-foreground">
            Un solo sistema para múltiples colegios con datos aislados.
          </p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-2">📊 Reportes</h3>
          <p className="text-sm text-muted-foreground">
            Boletas, actas y analytics en tiempo real.
          </p>
        </div>
      </div>
    </main>
  );
}
