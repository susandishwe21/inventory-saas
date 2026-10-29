import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './components/RequireAuth';
import { RequireOwner } from './components/RequireOwner';
import { RequireShop } from './components/RequireShop';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { CategoriesPage } from './pages/CategoriesPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShopProvider } from './shop/ShopProvider';

// The pages inside the app shell (sidebar + <Outlet />)
const appPages = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/products', element: <ProductsPage /> },
  { path: '/categories', element: <CategoriesPage /> },
  {
    path: '/suppliers',
    element: <PlaceholderPage title="Suppliers" description="Know where each product comes from." phase={11} />,
  },
  {
    path: '/history',
    element: <PlaceholderPage title="Stock history" description="Every stock in, stock out and adjustment in your shop." phase={16} />,
  },
  { element: <RequireOwner />, children: [{ path: '/settings', element: <SettingsPage /> }] }, // owners only
  { path: '*', element: <NotFoundPage /> },
];

const router = createBrowserRouter([
  // Public: login and register (signed-in users are sent on to the app)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  // Everything else: signed in → shop loaded → (onboarding | app pages)
  {
    element: <RequireAuth />,
    children: [
      {
        element: <ShopProvider />,
        children: [
          { path: '/onboarding', element: <OnboardingPage /> }, // signed in, no shop yet
          {
            element: <RequireShop />,
            children: [{ element: <AppLayout />, children: appPages }],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
