// src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-red-50 rounded-xl">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <h2 className="text-xl font-bold text-red-800">Something went wrong</h2>
          </div>
          <p className="mt-4 text-red-600">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 p-4 bg-red-100 rounded text-sm text-red-800 overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
          <div className="mt-6 flex space-x-4">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2 transition-colors"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh Page</span>
            </button>
            <button
              className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
