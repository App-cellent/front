/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, createContext } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import StackNavigator from './src/navigator/StackNavigator';
import PushNotification from "react-native-push-notification";
import {enableScreens} from 'react-native-screens';
import { TabBarProvider } from './src/utils/useTabBarVisibility';

function App(): React.JSX.Element {
    enableScreens();
  const customTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#fff',
    },
  };

  PushNotification.configure({
    onNotification: function (notification) {
      console.log("NOTIFICATION:", notification);
    },
    requestPermissions: Platform.OS === 'ios'
  });

  return (
  <TabBarProvider>
        <NavigationContainer theme={customTheme}>
            <StackNavigator />
        </NavigationContainer>
    </TabBarProvider>
  );
}

export default App;
