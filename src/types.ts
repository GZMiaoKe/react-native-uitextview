import {
  NativeSyntheticEvent,
  TextProps as RNTextProps,
  TargetedEvent,
} from 'react-native';

export interface TextSelectionData extends TargetedEvent {
  eventType: string;
  content?: string;
  start?: number;
  end?: number;
}

export interface TextViewProps extends RNTextProps {
  uiTextView?: boolean;
  menuItems?: { key: string; title: string }[];
  onSelection?: (e: NativeSyntheticEvent<TextSelectionData>) => void;
}
