import { createBrowserRouter, Navigate } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './components/RequireAuth';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { CategoriesPage } from './pages/CategoriesPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';

const router = createBrowserRouter([
  // Public: login and register (signed-in users are sent on to the app)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  // Everything else needs a signed-in user, and renders inside AppLayout (sidebar + <Outlet />)
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          {
            path: '/dashboard',
            element: <PlaceholderPage title="Dashboard" description="Stock value and in/low/out of stock at a glance." phase={9} />,
          },
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
          {
            path: '/settings',
            element: <PlaceholderPage title="Settings" description="Your shop and team members." phase={6} />,
          },
          { path: '*', element: <NotFoundPage /> },
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
