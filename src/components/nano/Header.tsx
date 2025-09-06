import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="dark-surface p-4 shadow-lg border-b border-border">
      <h1 className="text-2xl md:text-3xl font-display text-center font-bold">
        <span className="text-accent">Nano-Banana</span>{' '}
        <span className="text-primary">Shorts Editor</span>
      </h1>
    </header>
  );
};