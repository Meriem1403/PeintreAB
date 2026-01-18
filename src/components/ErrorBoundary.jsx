import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erreur capturée par ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: '#fafafa',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 300, color: '#1a1a1a', marginBottom: '1rem' }}>
            Une erreur s'est produite
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', maxWidth: '600px' }}>
            Désolé, une erreur inattendue s'est produite. Veuillez rafraîchir la page ou retourner à l'accueil.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '1rem 2rem',
              background: '#C6AC8F',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              transition: 'all 0.3s ease'
            }}
          >
            Retour à l'accueil
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
