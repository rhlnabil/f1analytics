import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import PublicLayout from './components/PublicLayout';
import Aurora from './components/Aurora';

const Home = lazy(() => import('./pages/Home'));
const Drivers = lazy(() => import('./pages/Drivers'));
const DriverDetail = lazy(() => import('./pages/DriverDetail'));
const Teams = lazy(() => import('./pages/Teams'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const Races = lazy(() => import('./pages/Races'));
const RaceDetail = lazy(() => import('./pages/RaceDetail'));
const Circuits = lazy(() => import('./pages/Circuits'));
const CircuitDetail = lazy(() => import('./pages/CircuitDetail'));
const Standings = lazy(() => import('./pages/Standings'));

const News = lazy(() => import('./pages/News'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OAuthSuccess = lazy(() => import('./pages/OAuthSuccess'));
const QrAccess = lazy(() => import('./pages/QrAccess'));

const FanDashboard = lazy(() => import('./pages/FanDashboard'));
const Games = lazy(() => import('./pages/Games'));
const MyDriver = lazy(() => import('./pages/MyDriver'));

const Predictions = lazy(() => import('./pages/games/Predictions'));
const Quiz = lazy(() => import('./pages/games/Quiz'));
const Reaction = lazy(() => import('./pages/games/Reaction'));
const PitStopChallenge = lazy(() => import('./pages/games/PitStopChallenge'));
const DriverGuesser = lazy(() => import('./pages/games/DriverGuesser'));
const CircuitGuesser = lazy(() => import('./pages/games/CircuitGuesser'));
const F1Wordle = lazy(() => import('./pages/games/F1Wordle'));
const MemoryGame = lazy(() => import('./pages/games/MemoryGame'));

const CinemaMode = lazy(() => import('./pages/CinemaMode'));

const AdminDrivers = lazy(() => import('./pages/admin/AdminDrivers'));
const AdminTeams = lazy(() => import('./pages/admin/AdminTeams'));
const AdminCircuits = lazy(() => import('./pages/admin/AdminCircuits'));
const AdminRaces = lazy(() => import('./pages/admin/AdminRaces'));
const AdminResults = lazy(() => import('./pages/admin/AdminResults'));
const Public = ({ children }) => <PublicLayout>{children}</PublicLayout>;

const PageLoader = () => (
  <div style={{
    minHeight: '60vh', display: 'grid', placeItems: 'center',
    color: '#e10600', fontFamily: 'Orbitron, sans-serif',
    fontSize: 11, letterSpacing: '0.35em', fontWeight: 700,
  }}>◆ CHARGEMENT...</div>
);

export default function App() {
  return (
    <BrowserRouter>
      <div style={{
        position: 'fixed', inset: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 0, opacity: 0.45,
        mixBlendMode: 'screen',
      }} aria-hidden="true">
        <Aurora colorStops={['#7a0300', '#e10600', '#ff1e00']} amplitude={0.9} blend={0.35} speed={0.8} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* PUBLIC */}
            <Route path="/" element={<Public><Home /></Public>} />
            <Route path="/drivers" element={<Public><Drivers /></Public>} />
            <Route path="/drivers/:id" element={<Public><DriverDetail /></Public>} />
            <Route path="/teams" element={<Public><Teams /></Public>} />
            <Route path="/teams/:id" element={<Public><TeamDetail /></Public>} />
            <Route path="/races" element={<Public><Races /></Public>} />
            <Route path="/races/:id" element={<Public><RaceDetail /></Public>} />
            <Route path="/circuits" element={<Public><Circuits /></Public>} />
            <Route path="/circuits/:id" element={<Public><CircuitDetail /></Public>} />
            <Route path="/standings" element={<Public><Standings /></Public>} />

            {/* NEWS */}
            <Route path="/news" element={<Public><News /></Public>} />
            <Route path="/news/:id" element={<Public><NewsDetail /></Public>} />

            {/* CINEMA */}
            <Route path="/cinema" element={<CinemaMode />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/qr-access" element={<QrAccess />} />

            {/* FAN */}
            <Route path="/fan" element={<ProtectedRoute><Public><FanDashboard /></Public></ProtectedRoute>} />
            <Route path="/fan/games" element={<ProtectedRoute><Public><Games /></Public></ProtectedRoute>} />
            <Route path="/fan/my-driver" element={<ProtectedRoute><Public><MyDriver /></Public></ProtectedRoute>} />

            {/* JEUX */}
            <Route path="/fan/predictions" element={<ProtectedRoute><Public><Predictions /></Public></ProtectedRoute>} />
            <Route path="/fan/quiz" element={<ProtectedRoute><Public><Quiz /></Public></ProtectedRoute>} />
            <Route path="/fan/reaction" element={<ProtectedRoute><Reaction /></ProtectedRoute>} />
            <Route path="/fan/pitstop" element={<ProtectedRoute><PitStopChallenge /></ProtectedRoute>} />
            <Route path="/fan/driver-guesser" element={<ProtectedRoute><DriverGuesser /></ProtectedRoute>} />
            <Route path="/fan/circuit-guesser" element={<ProtectedRoute><CircuitGuesser /></ProtectedRoute>} />
            <Route path="/fan/wordle" element={<ProtectedRoute><F1Wordle /></ProtectedRoute>} />
            <Route path="/fan/memory" element={<ProtectedRoute><MemoryGame /></ProtectedRoute>} />

            {/* ADMIN */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/drivers" replace />} />
              <Route path="drivers"  element={<AdminDrivers />} />
              <Route path="teams"    element={<AdminTeams />} />
              <Route path="circuits" element={<AdminCircuits />} />
              <Route path="races"    element={<AdminRaces />} />
              <Route path="results"  element={<AdminResults />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}