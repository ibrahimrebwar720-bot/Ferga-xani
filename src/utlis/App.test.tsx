import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import * as React from 'react';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App Component', () => {
  it('renders the title', async () => {
    render(<App />);
    
    // Check for the title "فێرگە" 
    const titles = await screen.findAllByText(/فێرگە/i);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('renders the login button', async () => {
    render(<App />);
    // The button contains an SVG and the text. We look for the text part.
    // In the app, it's defined in labels.googleLogin depending on interfaceLang.
    // Default interfaceLang is 'Sorani'.
    const loginBtn = await screen.findByText(/گووگڵ/i);
    expect(loginBtn).toBeInTheDocument();
  });
});
