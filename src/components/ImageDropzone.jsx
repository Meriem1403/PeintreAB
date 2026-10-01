import { useCallback, useRef, useState } from 'react';
import { FiImage, FiUploadCloud, FiX } from 'react-icons/fi';
import { uploadAPI } from '../utils/apiService';

const ImageDropzone = ({
  value,
  onChange,
  folder = 'uploads',
  label = 'Image',
  hint = 'PNG ou JPG, 10 Mo max',
}) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Choisissez un fichier image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image trop lourde (max. 10 Mo).');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const { url } = await uploadAPI.uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Échec du téléversement.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [folder]
  );

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const clear = () => onChange('');

  return (
    <div className="form-group image-dropzone-field">
      <span className="field-static-label">{label}</span>

      {value ? (
        <div className="image-dropzone-preview">
          <img src={value} alt="" />
          <div className="image-dropzone-preview-actions">
            <button
              type="button"
              className="image-dropzone-btn"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Remplacer
            </button>
            <button type="button" className="image-dropzone-btn image-dropzone-btn--ghost" onClick={clear}>
              <FiX aria-hidden /> Retirer
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-dropzone ${dragging ? 'is-dragging' : ''} ${uploading ? 'is-uploading' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-busy={uploading}
        >
          <div className="image-dropzone-icon">
            {uploading ? <FiUploadCloud className="spin" /> : <FiImage />}
          </div>
          <p className="image-dropzone-title">
            {uploading ? 'Envoi en cours…' : 'Glissez une image ou parcourez vos fichiers'}
          </p>
          <p className="image-dropzone-hint">{hint}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onFileChange}
        tabIndex={-1}
      />

      {error && <p className="image-dropzone-error">{error}</p>}
    </div>
  );
};

export default ImageDropzone;
