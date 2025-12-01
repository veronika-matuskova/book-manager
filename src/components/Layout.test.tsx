import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';

// Using globals from vitest

// Mock Navigation component
vi.mock('./Navigation', () => ({
  default: () => <nav data-testid="navigation">Navigation</nav>
}));

const routerProps = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

describe('Layout', () => {
  it('should render children content', () => {
    render(
      <BrowserRouter {...routerProps}>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render Navigation component', () => {
    render(
      <BrowserRouter {...routerProps}>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('navigation')).toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = render(
      <BrowserRouter {...routerProps}>
        <Layout>
          <div>Content</div>
        </Layout>
      </BrowserRouter>
    );
    
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ maxWidth: '1400px' });
  });

  it('should render multiple children', () => {
    render(
      <BrowserRouter {...routerProps}>
        <Layout>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </Layout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });
});

