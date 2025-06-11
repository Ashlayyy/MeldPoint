import type { ThemeTypes } from '@/types/themeTypes/ThemeType';

const PurpleTheme: ThemeTypes = {
  name: 'PurpleTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5',
    'carousel-control-size': 10
  },
  colors: {
    // primary: '#1e88e5',
    // secondary: '#5e35b1',
    // Primary color and its light/dark variants
    primary: '#093f96',          // Default
    primary_lighten_5: '#e6ebf5',
    primary_lighten_4: '#ccd7ea',
    primary_lighten_3: '#99afcc',
    primary_lighten_2: '#6687af',
    primary_lighten_1: '#335f91',
    primary_darken_1: '#07367e',
    primary_darken_2: '#062c66',
    primary_darken_3: '#05234e',
    primary_darken_4: '#041937',

    // Secondary color and its light/dark variants
    secondary: '#87368b',        // Default
    secondary_lighten_5: '#f5e6f5',
    secondary_lighten_4: '#ebcceb',
    secondary_lighten_3: '#d799d7',
    secondary_lighten_2: '#c366c3',
    secondary_lighten_1: '#af33af',
    secondary_darken_1: '#752d72',
    secondary_darken_2: '#5d255a',
    secondary_darken_3: '#461c43',
    secondary_darken_4: '#2e142c',    


    info: '#03c9d7',
    success: '#00c853',
    accent: '#FFAB91',
    warning: '#ffc107',
    error: '#f44336',
    simplePDCA: '#DAE5E6',
    lightprimary: '#eef2f6',
    lightsecondary: '#ede7f6',
    lightsuccess: '#b9f6ca',
    lighterror: '#f9d8d8',
    lightwarning: '#fff8e1',
    darkText: '#212121',
    lightText: '#616161',
    darkprimary: '#283376',
    darksecondary: '#67296A',
    borderLight: '#d0d0d0',
    inputBorder: '#787878',
    containerBg: '#eef2f6',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    primary200: '#b39ddb',
    secondary200: '#90caf9',
    gray50: '#fafafa',    // Lightest
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#e0e0e0',
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',   // Medium
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',   // Darkest
  }
};  
//   colors: {
//     primary: '#1e88e5',
//     secondary: '#5e35b1',
//     info: '#03c9d7',
//     success: '#00c853',
//     accent: '#FFAB91',
//     warning: '#ffc107',
//     error: '#f44336',
//     lightprimary: '#eef2f6',
//     lightsecondary: '#ede7f6',
//     lightsuccess: '#b9f6ca',
//     lighterror: '#f9d8d8',
//     lightwarning: '#fff8e1',
//     darkText: '#212121',
//     lightText: '#616161',
//     darkprimary: '#1565c0',
//     darksecondary: '#4527a0',
//     borderLight: '#d0d0d0',
//     inputBorder: '#787878',
//     containerBg: '#eef2f6',
//     surface: '#fff',
//     'on-surface-variant': '#fff',
//     facebook: '#4267b2',
//     twitter: '#1da1f2',
//     linkedin: '#0e76a8',
//     gray100: '#fafafa',
//     primary200: '#90caf9',
//     secondary200: '#b39ddb'
//   }
// };

const GreenTheme: ThemeTypes = {
  name: 'GreenTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5'
  },
  colors: {
    primary: '#607d8b',
    secondary: '#009688',
    info: '#03c9d7',
    success: '#14bb38',
    accent: '#d9534f',
    warning: '#ec9c3d',
    error: '#d9534f',
    lightprimary: '#eceff1',
    lightsecondary: '#e0f2f1',
    lightsuccess: '#b9f6ca',
    lighterror: '#f9d8d8',
    lightwarning: '#fff8e1',
    darkprimary: '#546e7a',
    darksecondary: '#00897b',
    darkText: '#212121',
    lightText: '#616161',
    borderLight: '#b0bec5',
    inputBorder: '#787878',
    containerBg: '#eceff1',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#fafafa',
    primary200: '#b0bec5',
    secondary200: '#80cbc4'
  }
};

const PinkTheme: ThemeTypes = {
  name: 'PinkTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5'
  },
  colors: {
    primary: '#203461',
    secondary: '#ec407a',
    info: '#03c9d7',
    success: '#17c13e',
    accent: '#FFAB91',
    warning: '#f0ad4e',
    error: '#d9534f',
    lightprimary: '#e4e7ec',
    lightsecondary: '#fde8ef',
    lightsuccess: '#b9f6ca',
    lighterror: '#f9d8d8',
    lightwarning: '#fff8e1',
    darkprimary: '#132145',
    darksecondary: '#e42a5d',
    darkText: '#212121',
    lightText: '#616161',
    borderLight: '#90caf9',
    inputBorder: '#787878',
    containerBg: '#e4e7ec',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#fafafa',
    primary200: '#909ab0',
    secondary200: '#f6a0bd'
  }
};

const YellowTheme: ThemeTypes = {
  name: 'YellowTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5'
  },
  colors: {
    primary: '#16595a',
    secondary: '#c77e23',
    info: '#03c9d7',
    success: '#00c853',
    accent: '#FFAB91',
    warning: '#ffc107',
    error: '#f44336',
    lightprimary: '#e3ebeb',
    lightsecondary: '#f8f0e5',
    lightsuccess: '#b9f6ca',
    lighterror: '#ef9a9a',
    lightwarning: '#fff8e1',
    darkprimary: '#135152',
    darksecondary: '#c1761f',
    darkText: '#212121',
    lightText: '#616161',
    borderLight: '#90caf9',
    inputBorder: '#787878',
    containerBg: '#e3ebeb',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#fafafa',
    primary200: '#8bacad',
    secondary200: '#e3bf91'
  }
};

const SeaGreenTheme: ThemeTypes = {
  name: 'SeaGreenTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5'
  },
  colors: {
    primary: '#173e43',
    secondary: '#3fb0ac',
    info: '#03c9d7',
    success: '#00e676',
    accent: '#FFAB91',
    warning: '#ffc107',
    error: '#f44336',
    lightprimary: '#e3e8e8',
    lightsecondary: '#e8f6f5',
    lightsuccess: '#b9f6ca',
    lighterror: '#ef9a9a',
    lightwarning: '#fff8e1',
    darkprimary: '#14383d',
    darksecondary: '#39a9a5',
    darkText: '#212121',
    lightText: '#616161',
    borderLight: '#90caf9',
    inputBorder: '#787878',
    containerBg: '#e3e8e8',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#fafafa',
    primary200: '#8b9fa1',
    secondary200: '#9fd8d6'
  }
};

const OliveGreenTheme: ThemeTypes = {
  name: 'OliveGreenTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5'
  },
  colors: {
    primary: '#0a2342',
    secondary: '#2ca58d',
    info: '#03c9d7',
    success: '#00e676',
    accent: '#FFAB91',
    warning: '#ffe57f',
    error: '#f44336',
    lightprimary: '#e3e8e8',
    lightsecondary: '#e8f6f5',
    lightsuccess: '#b9f6ca',
    lighterror: '#ef9a9a',
    lightwarning: '#fff8e1',
    darkprimary: '#0d282c',
    darksecondary: '#279d85',
    darkText: '#212121',
    lightText: '#616161',
    borderLight: '#90caf9',
    inputBorder: '#787878',
    containerBg: '#e2e5e8',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#fafafa',
    primary200: '#8591a1',
    secondary200: '#96d2c6'
  }
};

const SpeechBlueTheme: ThemeTypes = {
  name: 'SpeechBlueTheme',
  dark: false,
  variables: {
    'border-color': '#1e88e5'
  },
  colors: {
    primary: '#3f51b5',
    secondary: '#3f51b5',
    info: '#03c9d7',
    success: '#00c853',
    accent: '#FFAB91',
    warning: '#ffc107',
    error: '#f44336',
    lightprimary: '#e8eaf6',
    lightsecondary: '#e8eaf6',
    lightsuccess: '#b9f6ca',
    lighterror: '#ef9a9a',
    lightwarning: '#fff8e1',
    darkprimary: '#3949ab',
    darksecondary: '#3949ab',
    darkText: '#212121',
    lightText: '#616161',
    borderLight: '#90caf9',
    inputBorder: '#787878',
    containerBg: '#e8eaf6',
    surface: '#fff',
    'on-surface-variant': '#fff',
    facebook: '#4267b2',
    twitter: '#1da1f2',
    linkedin: '#0e76a8',
    gray100: '#fafafa',
    primary200: '#9fa8da',
    secondary200: '#9fa8da'
  }
};

export { PurpleTheme, GreenTheme, SpeechBlueTheme, OliveGreenTheme, PinkTheme, YellowTheme, SeaGreenTheme };
