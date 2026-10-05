const FormSwitch = ({ id, name, checked, onChange, label, description }) => (
  <div className="form-switch-row">
    <div className="form-switch-copy">
      <span className="form-switch-label" id={`${id}-label`}>
        {label}
      </span>
      {description != null && description !== '' && (
        <span className="form-switch-desc">{description}</span>
      )}
    </div>
    <label className="form-switch" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        aria-labelledby={`${id}-label`}
      />
      <span className="form-switch-slider" aria-hidden="true" />
    </label>
  </div>
);

export default FormSwitch;
