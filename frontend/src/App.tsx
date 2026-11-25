import { HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, LOGIN_REQUIRED, useAuth } from './services/auth';
import { DataProvider } from './services/store';
import { ToastProvider } from './components/ui';
import LoginPage from './pages/LoginPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import CochadasPage from './pages/CochadasPage';
import InventarioPage from './pages/InventarioPage';
import FormulasPage from './pages/FormulasPage';
import AlertasPage from './pages/AlertasPage';
import EnConstruccionPage from './pages/EnConstruccionPage';
import ReportesPage from './pages/ReportesPage';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import PrivacidadPage from './pages/PrivacidadPage';
import { AutorizacionDatos, PoliticaPublica, useHash } from './pages/LegalScreens';
import {
  ComprasPage, DesperdiciosPage, MateriasPrimasPage, ProduccionPage, ProductosPage, ProductoTerminadoPage, ProveedoresPage,
} from './pages/ListPages';

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

/** Sin sesión se muestra el login (excepto en la compilación de demostración, que no tiene backend). */
function Gate() {
  const { user, privacyPending } = useAuth();
  const hash = useHash();
  if (LOGIN_REQUIRED && !user) return hash.startsWith('#/privacidad') ? <PoliticaPublica /> : <LoginPage />;
  // Ley 1581 de 2012: antes de usar el sistema, cada usuario autoriza el tratamiento de sus datos.
  if (LOGIN_REQUIRED && privacyPending) return <AutorizacionDatos />;
  return (
    <DataProvider key={user?.id ?? 'demo'}>
    <ToastProvider>
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="cochadas" element={<CochadasPage />} />
          <Route path="produccion" element={<ProduccionPage />} />
          <Route path="formulas" element={<FormulasPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="producto-terminado" element={<ProductoTerminadoPage />} />
          <Route path="desperdicios" element={<DesperdiciosPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="materias-primas" element={<MateriasPrimasPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="alertas" element={<AlertasPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />
          <Route path="privacidad" element={<PrivacidadPage />} />
          <Route path="*" element={<EnConstruccionPage />} />
        </Route>
      </Routes>
    </HashRouter>
    </ToastProvider>
    </DataProvider>
  );
}
