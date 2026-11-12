import { HashRouter, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import CochadasPage from './pages/CochadasPage';
import InventarioPage from './pages/InventarioPage';
import FormulasPage from './pages/FormulasPage';
import AlertasPage from './pages/AlertasPage';
import EnConstruccionPage from './pages/EnConstruccionPage';
import {
  ComprasPage, DesperdiciosPage, MateriasPrimasPage, ProduccionPage, ProductosPage, ProductoTerminadoPage, ProveedoresPage,
} from './pages/ListPages';

export default function App() {
  return (
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
          <Route path="*" element={<EnConstruccionPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
