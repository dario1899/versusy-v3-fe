import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PictureDisplay.css';

import {
  fetchVersusesCount,
  fetchVersusByIndex,
  postVersusVote,
} from '../api/client';
import { normalizeVersusToPlayers, formatVersusTag } from '../utils/versusPayload';
import TagBar from './TagBar';
import BottomBar from './BottomBar';
import { formatVotePercent, getVotePercent } from '../utils/voteFormat';

import glosujButton from '../design/glosuj-button.png';
import vsButton from '../design/vs-button.png';
import leftArrow from '../design/left-arrow.png';
import rightArrow from '../design/right-arrow.png';

function GlosujButton({ votes, totalVotes, voted, onClick, disabled, placement }) {
  const percent = getVotePercent(votes, totalVotes);
  const frameClassName = [
    'glosuj-btn__frame',
    placement === 'top' ? 'glosuj-btn__frame--top' : 'glosuj-btn__frame--bottom',
    voted ? 'glosuj-btn__frame--voted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className="glosuj-btn"
      onClick={voted ? undefined : onClick}
      disabled={disabled || voted}
      type="button"
      aria-label={voted ? formatVotePercent(votes, totalVotes) : 'Głosuj'}
    >
      <span className={frameClassName}>
        <img src={glosujButton} alt="" aria-hidden="true" />
        {voted ? (
          <span className="glosuj-btn__pill">
            <span
              className="glosuj-btn__fill"
              style={{ width: `${percent}%` }}
              aria-hidden="true"
            />
            <span className="glosuj-btn__label">{percent}%</span>
          </span>
        ) : null}
      </span>
    </button>
  );
}

function VoteAppShell({ tag, children }) {
  return (
    <div className="app-vote-shell">
      <TagBar tag={tag} />
      <div className="app-vote-shell__content">{children}</div>
      <BottomBar />
    </div>
  );
}

const PictureDisplay = () => {
  const [images, setImages] = useState([]);
  /** After voting: tallies from API `{ pic1Votes, pic2Votes }`. */
  const [voteCounts, setVoteCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  /** Set only after a successful load — never advanced on failed fetch. */
  const [currentVersusId, setCurrentVersusId] = useState(1);
  const [totalSetCount, setTotalSetCount] = useState(0);
  const [error, setError] = useState('');
  /** API returned entity not found for attempted next — right arrow blocked. */
  const [allVersusSeen, setAllVersusSeen] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteLoading, setVoteLoading] = useState(false);
  const [versusTag, setVersusTag] = useState('#');
  const blobUrlsRef = useRef([]);

  const loadVersus = useCallback(async (targetId, opts = {}) => {
    const { signal } = opts;
    const aborted = () => signal?.aborted;

    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];

    setLoading(true);
    setError('');
    setVoteError('');
    setVoteCounts(null);
    setAllVersusSeen(false);
    setVersusTag('#');

    try {
      const data = await fetchVersusByIndex(targetId);
      if (aborted()) return;
      const { players, objectUrls } = normalizeVersusToPlayers(data);
      if (aborted()) {
        objectUrls.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      blobUrlsRef.current = objectUrls;
      setCurrentVersusId(targetId);
      setImages(players);
      setVersusTag(formatVersusTag(data));
      setAllVersusSeen(false);
    } catch (e) {
      if (aborted()) return;
      if (e.entityNotFound) {
        setAllVersusSeen(true);
        setImages([]);
      } else {
        setError(e?.message || 'Nie udało się załadować versus.');
        setAllVersusSeen(false);
      }
    } finally {
      if (!aborted()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const count = await fetchVersusesCount();
        if (cancelled) return;
        setTotalSetCount(count);
        if (count === 0) {
          setError('Brak zestawów versus.');
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Nie udało się pobrać listy.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (totalSetCount === 0) return;
    const ac = new AbortController();
    loadVersus(1, { signal: ac.signal });
    return () => {
      ac.abort();
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, [totalSetCount, loadVersus]);

  const handleImageClick = useCallback(
    (choice) => async () => {
      setVoteLoading(true);
      setVoteError('');
      try {
        const data = await postVersusVote(currentVersusId, choice);
        const p1 =
          data.pic1Votes ??
          data.pic1votes ??
          data.pic1_votes;
        const p2 =
          data.pic2Votes ??
          data.pic2votes ??
          data.pic2_votes;
        if (p1 != null && p2 != null) {
          setVoteCounts({
            pic1Votes: Number(p1),
            pic2Votes: Number(p2),
          });
        }
      } catch (e) {
        setVoteError(e?.message || 'Głosowanie nie powiodło się.');
      } finally {
        setVoteLoading(false);
      }
    },
    [currentVersusId]
  );

  const handleNextVersus = useCallback(async () => {
    if (totalSetCount <= 0 || allVersusSeen) return;
    const nextId =
      currentVersusId >= totalSetCount ? 1 : currentVersusId + 1;
    await loadVersus(nextId);
  }, [totalSetCount, allVersusSeen, currentVersusId, loadVersus]);

  const handlePrevVersus = useCallback(async () => {
    if (totalSetCount <= 0 || currentVersusId <= 1) return;
    const prevId = currentVersusId - 1;
    await loadVersus(prevId);
  }, [totalSetCount, currentVersusId, loadVersus]);

  if (loading) {
    return (
      <VoteAppShell tag={versusTag}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Ładowanie…</p>
        </div>
      </VoteAppShell>
    );
  }

  if (error) {
    return (
      <VoteAppShell tag={versusTag}>
        <div className="vote-screen">
          <div className="vote-error">{error}</div>
        </div>
      </VoteAppShell>
    );
  }

  if (allVersusSeen) {
    return (
      <VoteAppShell tag={versusTag}>
        <div className="vote-screen">
          <div className="vote-frame vote-frame--nav-only">
          <button
            className="nav-arrow nav-arrow-left"
            onClick={handlePrevVersus}
            disabled={voteLoading || currentVersusId <= 1}
            aria-label="Previous versus"
            type="button"
          >
            <img src={leftArrow} alt="previous" />
          </button>
          <button
            className="nav-arrow nav-arrow-right"
            onClick={handleNextVersus}
            disabled={voteLoading || allVersusSeen}
            aria-label="Next versus"
            type="button"
          >
            <img src={rightArrow} alt="next" />
          </button>
          <div className="versus-all-seen-message">
            Zobaczyłeś już wszystkie Versusy. Wróć później
          </div>
          </div>
        </div>
      </VoteAppShell>
    );
  }

  if (images.length < 2) {
    return (
      <VoteAppShell tag={versusTag}>
        <div className="vote-screen">
          <div className="vote-error">
            Nieprawidłowe dane versus (wymaganych jest dwóch graczy).
          </div>
        </div>
      </VoteAppShell>
    );
  }

  const topImage = images[0];
  const bottomImage = images[1];
  const voteTotal =
    voteCounts != null
      ? voteCounts.pic1Votes + voteCounts.pic2Votes
      : 0;

  return (
    <VoteAppShell tag={versusTag}>
      <div className="vote-screen">
        <div className="vote-frame">
        {voteError ? <div className="vote-action-error">{voteError}</div> : null}

        <button
          className="nav-arrow nav-arrow-left"
          onClick={handlePrevVersus}
          disabled={voteLoading || currentVersusId <= 1}
          aria-label="Previous versus"
          type="button"
        >
          <img src={leftArrow} alt="previous" />
        </button>
        <button
          className="nav-arrow nav-arrow-right"
          onClick={handleNextVersus}
          disabled={voteLoading}
          aria-label="Next versus"
          type="button"
        >
          <img src={rightArrow} alt="next" />
        </button>

        <div className="vote-section vote-section-top">
          <div className="player-card player-card-top">
            <img
              src={topImage.url}
              alt={topImage.alt}
              className="player-image"
            />

            <div className="player-name">{topImage.name}</div>

            <div className="player-footer">
              <GlosujButton
                placement="top"
                votes={voteCounts?.pic1Votes ?? 0}
                totalVotes={voteTotal}
                voted={voteCounts != null}
                onClick={handleImageClick(1)}
                disabled={voteLoading}
              />
            </div>
          </div>
        </div>

        <div className="vs-center">
          <img src={vsButton} alt="vs" className="vs-image" />
        </div>

        <div className="vote-section vote-section-bottom">
          <div className="player-card player-card-bottom">
            <div className="player-footer">
              <GlosujButton
                placement="bottom"
                votes={voteCounts?.pic2Votes ?? 0}
                totalVotes={voteTotal}
                voted={voteCounts != null}
                onClick={handleImageClick(2)}
                disabled={voteLoading}
              />
            </div>
            <div className="player-name">{bottomImage.name}</div>
            <img
              src={bottomImage.url}
              alt={bottomImage.alt}
              className="player-image"
            />
          </div>
        </div>
        </div>
      </div>
    </VoteAppShell>
  );
};

export default PictureDisplay;
