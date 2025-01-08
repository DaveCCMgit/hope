import { BrowserRouter } from 'react-router-dom';
import Login from './features/auth/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
}