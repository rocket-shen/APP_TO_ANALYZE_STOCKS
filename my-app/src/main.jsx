import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FinancialDashboard from './FinancialDashboard.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* <App /> */}
    <FinancialDashboard />  

  </StrictMode>,
)
