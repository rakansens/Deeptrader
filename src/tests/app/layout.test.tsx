import { render, screen } from '@testing-library/react'
import React from 'react'
import RootLayout from '@/app/layout'

jest.mock('@/app/globals.css', () => ({}), { virtual: true })
jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter' })
}))

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  })
})

jest.mock('next/navigation', () => ({
  usePathname: () => '/test'
}))

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="animate-presence">{children}</div>
  ),
  motion: {
    div: ({ children, ...rest }: { children: React.ReactNode }) => (
      <div data-testid="motion-div" {...rest}>{children}</div>
    )
  }
}))

describe('RootLayout', () => {
  it('wraps children with page transition', () => {
    render(
      <RootLayout>
        <div data-testid="child" />
      </RootLayout>
    )
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument()
    expect(screen.getByTestId('motion-div')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
