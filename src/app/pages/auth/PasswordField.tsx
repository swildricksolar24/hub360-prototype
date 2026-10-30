import { useState } from 'react';
import { Icon } from '../../../components/Icon/Icon';
import { TextInput, type TextInputProps } from '../../../components/TextInput/TextInput';
import styles from './auth.module.css';

/** TextInput with the Figma visibility toggle ("Login: Show Password"). */
export function PasswordField(props: Omit<TextInputProps, 'type' | 'trailingAction' | 'rightIcons'>) {
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      {...props}
      type={visible ? 'text' : 'password'}
      trailingAction={
        <button
          type="button"
          className={styles.reveal}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          disabled={props.disabled}
          onClick={() => setVisible(v => !v)}
        >
          <Icon name={visible ? 'visibility-off' : 'visibility'} size={20} color="currentColor" />
        </button>
      }
    />
  );
}
