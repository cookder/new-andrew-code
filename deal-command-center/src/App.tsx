import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/layout/BottomNav';
import { Home } from './pages/Home';
import { DealList } from './pages/DealList';
import { DealDetail } from './pages/DealDetail';
import { NewDeal } from './pages/NewDeal';
import { Calculators } from './pages/Calculators';
import { Reference } from './pages/Reference';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-full bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/deals" element={<DealList />} />
          <Route path="/deals/new" element={<NewDeal />} />
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/reference" element={<Reference />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
