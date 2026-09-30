import React from 'react';
import { createBrowserRouter } from "react-router";
import { AppProvider } from './store';
import { Scene } from './components/Scene';
import { HUD } from './components/HUD';
import { PixelEditor } from './components/PixelEditor';

const Root = () => (
  <AppProvider>
    <div className="w-full h-screen relative bg-black font-sans text-white overflow-hidden">
      <Scene />
      <HUD />
      <PixelEditor />
    </div>
  </AppProvider>
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
]);
