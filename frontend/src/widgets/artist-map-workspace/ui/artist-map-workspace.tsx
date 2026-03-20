'use client';

import type { ChangeEvent } from 'react';

import { formatCoordinates } from '@/entities/artist';
import { useArtistManagement } from '@/features/artist-management';
import type { MapLoadStatus } from '@/shared/lib/yandex-maps';

import { useYandexMap } from '../model/use-yandex-map';
import styles from './artist-map-workspace.module.scss';

const MAP_STATUS_LABELS: Record<MapLoadStatus, string> = {
  loading: 'Загрузка карты...',
  ready: 'Карта готова. Кликни по карте для новой точки.',
  error: 'Ошибка загрузки карты. Проверь API-ключ Yandex Maps.',
};

const MAP_STATUS_CLASS_NAMES: Record<MapLoadStatus, string> = {
  loading: styles.mapStatusLoading,
  ready: styles.mapStatusReady,
  error: styles.mapStatusError,
};

export const ArtistMapWorkspace = () => {
  const {
    artists,
    editorMode,
    activeArtistId,
    hintText,
    draft,
    activeArtistUpdatedAt,
    canSave,
    setDraftField,
    saveArtist,
    prepareNewPointMode,
    selectArtistForEditing,
    selectCoordinatesForNewPoint,
  } = useArtistManagement();

  const { mapContainerRef, mapStatus } = useYandexMap({
    artists,
    activeArtistId,
    onMapClick: selectCoordinatesForNewPoint,
    onArtistClick: selectArtistForEditing,
  });

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDraftField('name', event.target.value);
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDraftField('phone', event.target.value);
  };

  const handleNotesChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setDraftField('notes', event.target.value);
  };

  return (
    <main className={styles.mapPage}>
      <div className={`${styles.glow} ${styles.glowTop}`} aria-hidden="true" />
      <div className={`${styles.glow} ${styles.glowBottom}`} aria-hidden="true" />

      <section className={styles.mapShell}>
        <div className={styles.mapHeading}>
          <h1 className={styles.brand}>Lookforgrim</h1>
        </div>

        <div className={styles.mapGrid}>
          <div className={styles.mapFrame}>
            <div ref={mapContainerRef} className={styles.mapCanvas} />
            <p className={`${styles.mapStatus} ${MAP_STATUS_CLASS_NAMES[mapStatus]}`}>
              {MAP_STATUS_LABELS[mapStatus]}
            </p>
          </div>

          <aside className={styles.controlPanel}>
            <div className={styles.panelHead}>
              <p className={styles.panelTitle}>Гримеры</p>
              <span className={styles.panelCount}>{artists.length}</span>
            </div>

            <p className={styles.panelHint}>{hintText}</p>

            <div className={styles.pointList}>
              {artists.length === 0 ? (
                <p className={styles.emptyState}>Пока нет точек. Кликни по карте, чтобы создать первую.</p>
              ) : (
                artists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    className={`${styles.pointCard} ${activeArtistId === artist.id ? styles.pointCardActive : ''}`.trim()}
                    onClick={() => selectArtistForEditing(artist)}
                  >
                    <strong className={styles.pointCardName}>{artist.name || 'Без имени'}</strong>
                    <span className={styles.pointCardMeta}>{artist.phone || 'Телефон не указан'}</span>
                    <span className={styles.pointCardMeta}>{formatCoordinates(artist.coordinates)}</span>
                  </button>
                ))
              )}
            </div>

            <form className={styles.editorForm} onSubmit={saveArtist}>
              <p className={styles.editorTitle}>{editorMode === 'edit' ? 'Редактирование точки' : 'Новая точка'}</p>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Имя гримера</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={draft.name}
                  onChange={handleNameChange}
                  placeholder="Например, Анна Петрова"
                  required
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Телефон</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={draft.phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (900) 000-00-00"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Координаты</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={draft.coordinates ? formatCoordinates(draft.coordinates) : ''}
                  placeholder="Кликни по карте для выбора"
                  readOnly
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Комментарий</span>
                <textarea
                  className={styles.fieldTextarea}
                  rows={3}
                  value={draft.notes}
                  onChange={handleNotesChange}
                  placeholder="Особенности работы, район, выезд и т.д."
                />
              </label>

              {activeArtistUpdatedAt ? <p className={styles.editorMeta}>Обновлено: {activeArtistUpdatedAt}</p> : null}

              <div className={styles.editorActions}>
                <button className={`${styles.button} ${styles.buttonPrimary}`} type="submit" disabled={!canSave}>
                  {editorMode === 'edit' ? 'Сохранить изменения' : 'Добавить точку'}
                </button>
                <button className={`${styles.button} ${styles.buttonGhost}`} type="button" onClick={prepareNewPointMode}>
                  Новая точка
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
};
