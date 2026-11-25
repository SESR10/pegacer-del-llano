import { Card, PageHead } from '../components/ui';
import PoliticaTexto from '../legal/PoliticaTexto';

/** Política de tratamiento de datos, cookies y términos de uso, dentro del sistema. */
export default function PrivacidadPage() {
  return (
    <>
      <PageHead title="Privacidad y datos" subtitle="Política de tratamiento de datos personales, uso de cookies y términos de uso del sistema." />
      <Card><PoliticaTexto /></Card>
    </>
  );
}
