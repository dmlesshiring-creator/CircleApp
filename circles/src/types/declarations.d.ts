/**
 * Type declarations for packages without official types
 */

declare module 'expo-linear-gradient' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
}

declare module 'react-native-view-shot' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface CaptureOptions {
    format?: 'png' | 'jpg' | 'webm';
    quality?: number;
    result?: 'tmpfile' | 'base64' | 'data-uri' | 'zip-base64';
    snapshotContentContainer?: boolean;
  }

  export default class ViewShot extends Component<ViewProps> {
    capture(): Promise<string>;
  }
}

declare module 'expo-sharing' {
  export interface SharingOptions {
    mimeType?: string;
    dialogTitle?: string;
    UTI?: string;
  }

  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string, options?: SharingOptions): Promise<void>;
}
