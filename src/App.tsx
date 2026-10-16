import React, { useState, useEffect } from 'react';
import { GuestMenu } from './components/GuestMenu';
import { AdminDashboard } from './components/AdminDashboard';
import { KitchenDisplay } from './components/KitchenDisplay';
import { WaiterView } from './components/WaiterView';
import { BrandSheet } from './components/BrandSheet';
import { PrivacyPolicy } from './components/PrivacyPolicy';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple, robust client router without heavy external dependencies
  if (currentPath === '/brand') {
    return <BrandSheet />;
  }

  if (currentPath.startsWith('/admin')) {
    return <AdminDashboard />;
  }

  if (currentPath.startsWith('/kitchen')) {
    return <KitchenDisplay />;
  }

  if (currentPath.startsWith('/waiter')) {
    return <WaiterView />;
  }

  if (currentPath === '/privacy') {
    return <PrivacyPolicy />;
  }

  // QR landing /m/:qrToken or /m/:qrToken/item/:slug
  const qrMatch = currentPath.match(/^\/m\/([^/]+)(?:\/item\/([^/]+))?/);
  if (qrMatch) {
    const qrToken = qrMatch[1];
    const itemSlug = qrMatch[2];
    return <GuestMenu qrToken={qrToken} initialItemSlug={itemSlug} />;
  }

  // Root path: renders the guest menu with default Table 1 token
  return <GuestMenu qrToken="crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc" />;
};
