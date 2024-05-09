import React from 'react';
import type { ViewStyle, TextProps } from 'react-native';
import {
  requireNativeComponent,
  StyleSheet,
  UIManager,
  Text as RNText,
} from 'react-native';
import type { TextViewProps } from './types';

export interface RNUITextViewProps extends TextProps {
  children: React.ReactNode;
  style: ViewStyle[];
}

const RNUITextView =
  UIManager.getViewManagerConfig?.('RTNSelectableTextView') != null
    ? requireNativeComponent<RNUITextViewProps>('RTNSelectableTextView')
    : () => {
        return null;
      };

const TextAncestorContext = React.createContext<[boolean, ViewStyle]>([
  false,
  StyleSheet.create({}),
]);

const useTextAncestorContext = () => React.useContext(TextAncestorContext);

const textDefaults: TextProps = {
  allowFontScaling: true,
  selectable: true,
};

function UITextViewInner({
  style,
  children,
  ...rest
}: TextProps & {
  uiTextView?: boolean;
}) {
  const [isAncestor, rootStyle] = useTextAncestorContext();
  // Flatten the styles, and apply the root styles when needed
  const flattenedStyle = React.useMemo(
    () => StyleSheet.flatten([rootStyle, style]),
    [rootStyle, style],
  );

  if (!isAncestor) {
    return (
      <TextAncestorContext.Provider value={[true, flattenedStyle]}>
        <RNUITextView
          {...textDefaults}
          {...rest}
          ellipsizeMode={rest.ellipsizeMode ?? rest.lineBreakMode ?? 'tail'}
          style={[flattenedStyle]}
          onPress={undefined} // We want these to go to the children only
          onLongPress={undefined}>
          {React.Children.toArray(children).map((c, index) => {
            if (React.isValidElement(c)) {
              return c;
            } else if (typeof c === 'string' || typeof c === 'number') {
              return (
                <RNText
                  key={index}
                  style={flattenedStyle}
                  children={c.toString()}
                  {...rest}
                />
              );
            }

            return null;
          })}
        </RNUITextView>
      </TextAncestorContext.Provider>
    );
  } else {
    return (
      <>
        {React.Children.toArray(children).map((c, index) => {
          if (React.isValidElement(c)) {
            return c;
          } else if (typeof c === 'string' || typeof c === 'number') {
            return (
              <RNText
                key={index}
                style={flattenedStyle}
                children={c.toString()}
                {...rest}
              />
            );
          }

          return null;
        })}
      </>
    );
  }
}

export function UITextView(props: TextViewProps) {
  // This will never actually get called conditionally, so we don't need
  // to worry about the warning
  const [isAncestor] = useTextAncestorContext();

  const [selectable, setSelectable] = React.useState(false);
  // Even if the uiTextView prop is set, we can still default to using
  // normal selection (i.e. base RN text) if the text doesn't need to be
  // selectable
  if ((!props.selectable || !props.uiTextView) && !isAncestor) {
    return <RNText {...props} />;
  }

  return (
    <UITextViewInner
      {...props}
      selectable={selectable}
      onLayout={e => {
        props.onLayout?.(e);
        setSelectable(props.selectable ?? false);
      }}
    />
  );
}
