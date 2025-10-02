import { PipelineProvider } from './contexts/PipelineContext.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  return (
    <PipelineProvider>
      <Dashboard />
    </PipelineProvider>
  );
}

export default App;