import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * Champ mot de passe avec bouton Afficher / Masquer bien visible.
 */
const PasswordInput = ({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  required = false,
  minLength,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {visible ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
        <span>{visible ? 'Masquer' : 'Afficher'}</span>
      </button>
    </div>
  );
};

export default PasswordInput;
