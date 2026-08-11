import { useEffect } from 'react';
import { Keyboard } from 'react-native';

export function dismissKeyboard() {
  Keyboard.dismiss();
}

export function useBlurOnClose(active: boolean) {
  useEffect(() => {
    if (!active) {
      dismissKeyboard();
    }
  }, [active]);
}
