import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root index
 * ----------
 * This screen just redirects into the main tab navigator.
 */
export default function RootIndex() {
  // Send users straight into the (tabs) group
  return <Redirect href="/(tabs)" />;
}