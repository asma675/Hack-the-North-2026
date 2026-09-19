import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router,Route,Routes,Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AegisProvider } from '@/lib/useAegis';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Overview from '@/pages/Overview';import JudgeMode from '@/pages/JudgeMode';import WarRoom from '@/pages/WarRoom';import EvidenceCourt from '@/pages/EvidenceCourt';import Approvals from '@/pages/Approvals';import AgentPassport from '@/pages/AgentPassport';import GateControl from '@/pages/GateControl';import FleetControl from '@/pages/FleetControl';import Infrastructure from '@/pages/Infrastructure';import Resources from '@/pages/Resources';import EvidenceGraph from '@/pages/EvidenceGraph';import AttackReplay from '@/pages/AttackReplay';import Login from '@/pages/Login';import Register from '@/pages/Register';import ForgotPassword from '@/pages/ForgotPassword';import ResetPassword from '@/pages/ResetPassword';

function App(){return <AuthProvider><QueryClientProvider client={queryClientInstance}><Router><ScrollToTop/><Routes>
  <Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/><Route path="/reset-password" element={<ResetPassword/>}/>
  <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace/>}/>}><Route element={<AegisProvider><Layout/></AegisProvider>}>
    <Route path="/app" element={<Overview/>}/><Route path="/app/judge" element={<JudgeMode/>}/><Route path="/app/incidents/:id" element={<WarRoom/>}/><Route path="/app/incidents/:id/evidence" element={<EvidenceGraph/>}/><Route path="/app/incidents/:id/replay" element={<AttackReplay/>}/><Route path="/app/evidence-court" element={<EvidenceCourt/>}/><Route path="/app/aegis-gate" element={<GateControl/>}/><Route path="/app/action-firewall" element={<Navigate to="/app/aegis-gate?tab=firewall" replace/>}/><Route path="/app/policies" element={<Navigate to="/app/aegis-gate?tab=policies" replace/>}/><Route path="/app/approvals" element={<Approvals/>}/><Route path="/app/agents" element={<FleetControl/>}/><Route path="/app/agents/:id" element={<AgentPassport/>}/><Route path="/app/trust" element={<Navigate to="/app/agents?tab=trust" replace/>}/><Route path="/app/infrastructure" element={<Infrastructure/>}/><Route path="/app/integrations" element={<Navigate to="/app/infrastructure?tab=integrations" replace/>}/><Route path="/app/edge" element={<Navigate to="/app/infrastructure?tab=edge" replace/>}/><Route path="/app/observability" element={<Navigate to="/app/infrastructure?tab=observability" replace/>}/><Route path="/app/resources" element={<Resources/>}/><Route path="/app/field" element={<Navigate to="/app/resources?tab=field" replace/>}/><Route path="/app/platform" element={<Navigate to="/app/resources?tab=platform" replace/>}/><Route path="/app/codex" element={<Navigate to="/app/resources?tab=codex" replace/>}/>
  </Route></Route><Route path="*" element={<PageNotFound/>}/>
</Routes><Toaster/></Router></QueryClientProvider></AuthProvider>}
export default App;
