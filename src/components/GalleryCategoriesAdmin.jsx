import { useState } from 'react';
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import { galleryCategoriesAPI } from '../utils/apiService';
import { useGalleryCategories } from '../contexts/GalleryCategoriesContext';
import './GalleryCategoriesAdmin.css';

const GalleryCategoriesAdmin = () => {
  const { categories, refreshCategories, setCategories } = useGalleryCategories();
  const [label, setLabel] = useState('');
  const [lead, setLead] = useState('');
  const [createPagination, setCreatePagination] = useState(true);
  const [createPerPage, setCreatePerPage] = useState(12);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editLead, setEditLead] = useState('');
  const [editPagination, setEditPagination] = useState(true);
  const [editPerPage, setEditPerPage] = useState(12);

  const persistOrder = async (nextList) => {
    setCategories(nextList);
    await galleryCategoriesAPI.reorder(nextList.map((c) => c.id));
    await refreshCategories();
  };

  const move = async (index, direction) => {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSaving(true);
    setError('');
    try {
      await persistOrder(next);
    } catch (err) {
      setError(err.message || 'Impossible de réordonner');
      await refreshCategories();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    setError('');
    try {
      await galleryCategoriesAPI.create({
        label: label.trim(),
        lead: lead.trim(),
        pagination_enabled: createPagination,
        items_per_page: createPerPage,
      });
      setLabel('');
      setLead('');
      setCreatePagination(true);
      setCreatePerPage(12);
      await refreshCategories();
    } catch (err) {
      setError(err.message || 'Création impossible');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditLead(cat.lead || '');
    setEditPagination(
      cat.pagination_enabled === undefined || cat.pagination_enabled === null
        ? true
        : Boolean(cat.pagination_enabled)
    );
    setEditPerPage(cat.items_per_page || 12);
  };

  const saveEdit = async (id) => {
    if (!editLabel.trim()) return;
    setSaving(true);
    setError('');
    try {
      await galleryCategoriesAPI.update(id, {
        label: editLabel.trim(),
        lead: editLead.trim(),
        pagination_enabled: editPagination,
        items_per_page: editPerPage,
      });
      setEditingId(null);
      await refreshCategories();
    } catch (err) {
      setError(err.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (cat.is_locked || cat.kind === 'events') return;
    const ok = window.confirm(
      `Supprimer l’onglet « ${cat.label} » ? Les œuvres doivent d’abord être déplacées ou supprimées.`
    );
    if (!ok) return;
    setSaving(true);
    setError('');
    try {
      await galleryCategoriesAPI.delete(cat.id);
      await refreshCategories();
    } catch (err) {
      setError(err.message || 'Suppression impossible');
    } finally {
      setSaving(false);
    }
  };

  const paginationSummary = (cat) => {
    const enabled =
      cat.pagination_enabled === undefined || cat.pagination_enabled === null
        ? true
        : Boolean(cat.pagination_enabled);
    if (!enabled) return 'Sans pagination — tout sur une page';
    return `Pagination — ${cat.items_per_page || 12} par page`;
  };

  return (
    <div className="gcat-admin">
      {error && (
        <div className="gcat-admin__error" role="alert">
          {error}
        </div>
      )}

      <ul className="gcat-admin__list">
        {categories.map((cat, index) => (
          <li key={cat.id} className="gcat-admin__item">
            <div className="gcat-admin__order">
              <button
                type="button"
                className="gcat-admin__icon-btn"
                onClick={() => move(index, -1)}
                disabled={saving || index === 0}
                aria-label="Monter"
              >
                <FiArrowUp />
              </button>
              <button
                type="button"
                className="gcat-admin__icon-btn"
                onClick={() => move(index, 1)}
                disabled={saving || index === categories.length - 1}
                aria-label="Descendre"
              >
                <FiArrowDown />
              </button>
            </div>

            <div className="gcat-admin__body">
              {editingId === cat.id ? (
                <>
                  <input
                    className="gcat-admin__input"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    aria-label="Libellé"
                  />
                  <textarea
                    className="gcat-admin__textarea"
                    value={editLead}
                    onChange={(e) => setEditLead(e.target.value)}
                    rows={2}
                    placeholder="Texte d’intro sous le titre (optionnel)"
                    aria-label="Description"
                  />
                  <label className="gcat-admin__check">
                    <input
                      type="checkbox"
                      checked={editPagination}
                      onChange={(e) => setEditPagination(e.target.checked)}
                    />
                    <span>Activer la pagination sur la galerie publique</span>
                  </label>
                  {editPagination && (
                    <label className="gcat-admin__field gcat-admin__field--inline">
                      <span>Éléments par page</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editPerPage}
                        onChange={(e) => setEditPerPage(Number(e.target.value) || 12)}
                      />
                    </label>
                  )}
                  <div className="gcat-admin__edit-actions">
                    <button
                      type="button"
                      className="gcat-admin__btn gcat-admin__btn--primary"
                      onClick={() => saveEdit(cat.id)}
                      disabled={saving}
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      className="gcat-admin__btn"
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="gcat-admin__title-row">
                    <strong>{cat.label}</strong>
                    <code className="gcat-admin__slug">/{cat.slug}</code>
                    {cat.kind === 'events' && (
                      <span className="gcat-admin__badge">Événements</span>
                    )}
                  </div>
                  {cat.lead ? <p className="gcat-admin__lead">{cat.lead}</p> : null}
                  <p className="gcat-admin__meta">{paginationSummary(cat)}</p>
                </>
              )}
            </div>

            {editingId !== cat.id && (
              <div className="gcat-admin__actions">
                <button
                  type="button"
                  className="gcat-admin__btn"
                  onClick={() => startEdit(cat)}
                  disabled={saving}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="gcat-admin__icon-btn gcat-admin__icon-btn--danger"
                  onClick={() => handleDelete(cat)}
                  disabled={saving || cat.is_locked || cat.kind === 'events'}
                  title={
                    cat.is_locked || cat.kind === 'events'
                      ? 'Onglet système — non supprimable'
                      : 'Supprimer'
                  }
                  aria-label="Supprimer"
                >
                  <FiTrash2 />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <form className="gcat-admin__create" onSubmit={handleCreate}>
        <h3>Ajouter un onglet</h3>
        <label className="gcat-admin__field">
          <span>Nom affiché *</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex. Aquarelles, Sculptures…"
            required
          />
        </label>
        <label className="gcat-admin__field">
          <span>Texte d’intro (optionnel)</span>
          <textarea
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            rows={2}
            placeholder="Court texte sous le titre dans la galerie"
          />
        </label>
        <label className="gcat-admin__check">
          <input
            type="checkbox"
            checked={createPagination}
            onChange={(e) => setCreatePagination(e.target.checked)}
          />
          <span>Activer la pagination</span>
        </label>
        {createPagination && (
          <label className="gcat-admin__field gcat-admin__field--inline">
            <span>Éléments par page</span>
            <input
              type="number"
              min={1}
              max={100}
              value={createPerPage}
              onChange={(e) => setCreatePerPage(Number(e.target.value) || 12)}
            />
          </label>
        )}
        <button
          type="submit"
          className="gcat-admin__btn gcat-admin__btn--primary"
          disabled={saving || !label.trim()}
        >
          <FiPlus aria-hidden />
          Créer l’onglet
        </button>
      </form>
    </div>
  );
};

export default GalleryCategoriesAdmin;
