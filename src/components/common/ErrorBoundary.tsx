import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

// ============================================
// Error Boundary Component
// ============================================
// ⚠️ จับ rendering errors และป้องกัน app crash
// ใช้ wrap components ที่ใช้ที่ navigate หลัก เพื่อ catch errors
// 
// นำเข้าใช้ใน AppNavigator.tsx:
// <ErrorBoundary>
//   <RootNavigator />
// </ErrorBoundary>

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // ⚠️ Log error to console (production: send to error tracking service)
    console.error('✗ ERROR BOUNDARY CAUGHT:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // ที่นี่คุณสามารถ:
    // 1. Log to Sentry/Firebase Crashlytics
    // 2. Send to analytics backend
    // 3. Show notification
    // ตัวอย่าง:
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            {/* Header */}
            <Text style={styles.title}>⚠️ Something went wrong</Text>
            
            {/* Error count warning */}
            {this.state.errorCount > 3 && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Multiple errors detected ({this.state.errorCount}x).
                  If this persists, please reinstall the app.
                </Text>
              </View>
            )}

            {/* Error message */}
            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error Message:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              </View>
            )}

            {/* Error stack trace (development only)*/}
            {this.state.errorInfo && __DEV__ && (
              <View style={styles.stackBox}>
                <Text style={styles.stackTitle}>Stack Trace:</Text>
                <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
              </View>
            )}

            {/* Helpful instructions */}
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>What to do:</Text>
              <Text style={styles.instructionText}>1. Tap "Try Again" to recover</Text>
              <Text style={styles.instructionText}>2. If it persists, restart the app</Text>
              <Text style={styles.instructionText}>
                3. If still broken, please contact support@nursego.app
              </Text>
            </View>

            {/* Reset button */}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {/* Development info */}
            {__DEV__ && (
              <Text style={styles.devInfo}>
                💡 Error Boundary is in development mode. See console for details.
              </Text>
            )}
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5f5', // Light red background
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#c53030',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fed7d7',
    borderLeftColor: '#fc8181',
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  warningText: {
    color: '#742a2a',
    fontSize: 14,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fce8e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a71930',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#742a2a',
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  stackBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  stackText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    fontFamily: 'monospace',
  },
  instructionsBox: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftColor: '#4caf50',
    borderLeftWidth: 4,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b5e20',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#2e7d32',
    marginBottom: 4,
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  devInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
