import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  buildCameraStartAttempts,
  cameraScanErrorMessage,
  qrBoxForViewfinder,
} from '../utils/cameraScan';
import {
  FiAlertCircle,
  FiCalendar,
  FiCamera,
  FiCameraOff,
  FiCheckCircle,
  FiExternalLink,
  FiMapPin,
  FiUsers,
} from 'react-icons/fi';
import { eventsAPI } from '../utils/apiService';
import { useWorks } from '../contexts/WorksContext';
import { formatDurationLabel } from '../utils/eventDates';
import { adminTabPath } from '../constants/adminRoutes';
import '../styles/adminEventShell.css';
import './TicketScannerAdmin.css';

const SCANNER_ID = 'ticket-scanner-viewfinder';

const extractCode = (raw) => {
  const s = String(raw || '').trim();
  const match = s.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );
  return match ? match[0].toLowerCase() : null;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const initials = (first, last) =>
  `${(first || '?').charAt(0)}${(last || '').charAt(0)}`.toUpperCase();

const TicketScannerAdmin = () => {
  const { works } = useWorks();
  const events = works.evenements || [];
  const [searchParams] = useSearchParams();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: '', at: 0 });

  const selectedEvent = useMemo(
    () => events.find((ev) => String(ev.id) === String(selectedEventId)),
    [events, selectedEventId]
  );

  const eventDuration = useMemo(() => {
    if (!selectedEvent?.date_debut) return null;
    return formatDurationLabel(selectedEvent.date_debut, selectedEvent.date_fin);
  }, [selectedEvent]);

  useEffect(() => {
    const fromUrl = searchParams.get('event');
    if (fromUrl && events.some((e) => String(e.id) === fromUrl)) {
      setSelectedEventId(fromUrl);
      return;
    }
    if (events.length > 0) {
      setSelectedEventId((prev) => prev || String(events[0].id));
    }
  }, [events, searchParams]);

  const pushHistory = useCallback((entry) => {
    setHistory((prev) => [entry, ...prev].slice(0, 20));
  }, []);

  const processCode = useCallback(
    async (raw) => {
      const code = extractCode(raw);
      if (!code) {
        setLastResult({ type: 'error', message: 'QR code non reconnu (UUID attendu)' });
        return;
      }

      const now = Date.now();
      if (lastScanRef.current.code === code && now - lastScanRef.current.at < 2500) {
        return;
      }
      lastScanRef.current = { code, at: now };

      setProcessing(true);
      setLastResult(null);
      try {
        const res = await eventsAPI.checkIn(code, {
          work_id: selectedEventId || undefined,
        });
        const reg = res.registration;
        pushHistory({
          at: new Date().toISOString(),
          ok: true,
          already: res.already_checked_in,
          reg,
        });
        setLastResult({
          type: res.already_checked_in ? 'warn' : 'success',
          message: res.message,
          registration: reg,
        });
      } catch (err) {
        pushHistory({
          at: new Date().toISOString(),
          ok: false,
          message: err.message,
        });
        setLastResult({ type: 'error', message: err.message || 'Échec du contrôle' });
      } finally {
        setProcessing(false);
      }
    },
    [selectedEventId, pushHistory]
  );

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      setCameraOn(false);
      return;
    }
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      /* ignore */
    }
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (scannerRef.current) return;
    setLastResult(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setLastResult({ type: 'error', message: cameraScanErrorMessage(new Error('insecure')) });
      return;
    }

    const viewfinder = document.getElementById(SCANNER_ID);
    if (!viewfinder) {
      setLastResult({ type: 'error', message: 'Zone de scan indisponible. Rechargez la page.' });
      return;
    }

    const scanner = new Html5Qrcode(SCANNER_ID);
    const scanConfig = {
      fps: 10,
      qrbox: qrBoxForViewfinder,
      aspectRatio: 1,
    };

    let lastErr = null;
    const attempts = await buildCameraStartAttempts();

    for (const cameraConfig of attempts) {
      try {
        await scanner.start(cameraConfig, scanConfig, (decoded) => processCode(decoded), () => {});
        scannerRef.current = scanner;
        setCameraOn(true);
        return;
      } catch (err) {
        lastErr = err;
        try {
          await scanner.stop();
        } catch {
          /* ignore */
        }
      }
    }

    try {
      scanner.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setLastResult({
      type: 'error',
      message: cameraScanErrorMessage(lastErr || new Error('NO_CAMERA')),
    });
  }, [processCode]);

  useEffect(
    () => () => {
      stopCamera();
    },
    [stopCamera]
  );

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processCode(manualCode);
    setManualCode('');
  };

  if (events.length === 0) {
    return (
      <div className="vscan adb-shell">
        <div className="vscan-empty">
          <FiCalendar size={48} strokeWidth={1.1} />
          <h2>Aucun événement</h2>
          <p>Créez une exposition pour contrôler les billets à l&apos;entrée.</p>
          <Link to={adminTabPath('evenements')} className="adb-btn adb-btn--primary">
            Aller aux événements
          </Link>
        </div>
      </div>
    );
  }

  const reg = lastResult?.registration;
  const guest = reg?.guest;

  return (
    <div className="vscan adb-shell">
      <header
        className="adb-cover vscan-cover"
        style={
          selectedEvent?.image
            ? { '--adb-cover-url': `url("${selectedEvent.image}")` }
            : undefined
        }
      >
        <div className="adb-cover__inner">
          <div className="adb-cover__row">
            <div className="vscan-cover__left">
              <label htmlFor="vscan-event-select" className="adb-sr-only">
                Événement contrôlé
              </label>
              <select
                id="vscan-event-select"
                className="adb-event-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titre}
                  </option>
                ))}
              </select>
              <p className="adb-cover__hint">
                Seuls les billets de cet événement sont acceptés. Changez l&apos;expo si besoin.
              </p>
            </div>
            <div className="adb-cover__actions">
              <Link to={adminTabPath('visiteurs')} className="adb-btn adb-btn--ghost">
                <FiUsers aria-hidden />
                Tableau de bord
              </Link>
              {selectedEvent && (
                <Link
                  to={`/galerie/evenements/${selectedEvent.id}`}
                  className="adb-btn adb-btn--ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Site public
                  <FiExternalLink aria-hidden />
                </Link>
              )}
            </div>
          </div>

          {selectedEvent && (
            <div className="adb-cover__main">
              <div>
                <span className="adb-badge adb-badge--live">Mode entrée</span>
                <h2 className="adb-cover__title">{selectedEvent.titre}</h2>
                {eventDuration && (
                  <p className="adb-cover__meta">
                    <FiCalendar aria-hidden />
                    {eventDuration.range}
                  </p>
                )}
                {selectedEvent.lieu && (
                  <p className="adb-cover__meta">
                    <FiMapPin aria-hidden />
                    {selectedEvent.lieu}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="vscan-workspace">
        <section className="vscan-stage" aria-label="Scanner caméra">
          <div className="vscan-stage__view">
            <div id={SCANNER_ID} className="vscan-viewfinder" />
            {!cameraOn && (
              <div className="vscan-stage__idle">
                <FiCamera size={40} strokeWidth={1.1} />
                <p>Activez la caméra pour scanner les QR codes des billets</p>
              </div>
            )}
          </div>

          <div className="vscan-stage__bar">
            {!cameraOn ? (
              <button type="button" className="vscan-btn vscan-btn--primary" onClick={startCamera}>
                <FiCamera aria-hidden />
                Démarrer la caméra
              </button>
            ) : (
              <button type="button" className="vscan-btn vscan-btn--muted" onClick={stopCamera}>
                <FiCameraOff aria-hidden />
                Arrêter
              </button>
            )}

            <form className="vscan-manual" onSubmit={handleManualSubmit}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Code UUID ou lien billet…"
                autoComplete="off"
                aria-label="Code billet manuel"
              />
              <button
                type="submit"
                className="vscan-btn vscan-btn--soft"
                disabled={processing || !manualCode.trim()}
              >
                Valider
              </button>
            </form>
          </div>
        </section>

        <aside className="vscan-side" aria-label="Résultat et historique">
          <div
            className={`vscan-result vscan-result--${processing ? 'loading' : lastResult?.type || 'idle'}`}
          >
            {processing && <p className="vscan-result__lead">Vérification en cours…</p>}

            {!processing && !lastResult && (
              <>
                <p className="vscan-result__lead">En attente d&apos;un scan</p>
                <p className="vscan-result__sub">
                  Le visiteur validé s&apos;affiche ici avec l&apos;heure d&apos;entrée.
                </p>
              </>
            )}

            {!processing && lastResult && (
              <>
                <div className={`vscan-alert vscan-alert--${lastResult.type}`}>
                  {lastResult.type === 'success' ? (
                    <FiCheckCircle aria-hidden />
                  ) : (
                    <FiAlertCircle aria-hidden />
                  )}
                  <p>{lastResult.message}</p>
                </div>

                {guest && (
                  <div className="vscan-guest-card">
                    <div className="vscan-guest-card__avatar" aria-hidden>
                      {initials(guest.first_name, guest.last_name)}
                    </div>
                    <div>
                      <p className="vscan-guest-card__name">
                        {guest.first_name} {guest.last_name}
                      </p>
                      <p className="vscan-guest-card__email">{guest.email}</p>
                      <ul className="vscan-guest-card__facts">
                        <li>
                          <span>Événement</span>
                          {reg.event_titre}
                        </li>
                        {reg.slot_label && (
                          <li>
                            <span>Créneau</span>
                            {reg.slot_label}
                          </li>
                        )}
                        {reg.tickets_total > 1 && (
                          <li>
                            <span>Billet</span>
                            {reg.ticket_index} / {reg.tickets_total}
                          </li>
                        )}
                        <li>
                          <span>Entrée</span>
                          {formatDateTime(reg.checked_in_at)}
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {history.length > 0 && (
            <div className="vscan-history">
              <h3>Derniers contrôles</h3>
              <ul>
                {history.map((h, i) => (
                  <li
                    key={`${h.at}-${i}`}
                    className={`vscan-history__item ${h.ok ? (h.already ? 'is-warn' : 'is-ok') : 'is-error'}`}
                  >
                    <time>{formatDateTime(h.at)}</time>
                    {h.ok ? (
                      <span>
                        {h.reg.guest.first_name} {h.reg.guest.last_name}
                        {h.already ? ' · déjà entré' : ' · entrée OK'}
                      </span>
                    ) : (
                      <span>{h.message}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TicketScannerAdmin;
