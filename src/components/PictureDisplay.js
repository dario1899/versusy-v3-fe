import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PictureDisplay.css';

import {
  fetchVersusesCount,
  fetchVersusByIndex,
  postVersusVote,
} from '../api/client';
import { normalizeVersusToPlayers } from '../utils/versusPayload';
import { formatVoteSummary } from '../utils/voteFormat';

import glosujButton from '../design/glosuj-button.png';
import vsButton from '../design/vs-button.png';
import leftArrow from '../design/left-arrow.png';
import rightArrow from '../design/right-arrow.png';
import tloTop from '../design/tlo1.png';
import tloBottom from '../design/tlo2.png';

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
      <div className="loading">
        <div className="spinner"></div>
        <p>Ładowanie…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vote-screen">
        <div className="vote-error">{error}</div>
      </div>
    );
  }

  if (allVersusSeen) {
    return (
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
    );
  }

  if (images.length < 2) {
    return (
      <div className="vote-screen">
        <div className="vote-error">
          Nieprawidłowe dane versus (wymaganych jest dwóch graczy).
        </div>
      </div>
    );
  }

  const topImage = images[0];
  const bottomImage = images[1];
  const voteTotal =
    voteCounts != null
      ? voteCounts.pic1Votes + voteCounts.pic2Votes
      : 0;

  return (
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

        <div
          className="vote-section vote-section-top"
          style={{ backgroundImage: `url(${tloTop})` }}
        >
          <div className="player-card player-card-top">
            <img
              src={topImage.url}
              alt={topImage.alt}
              className="player-image"
            />

            <div className="player-footer">
              <div className="player-name">{topImage.name}</div>
              {voteCounts == null ? (
                <button
                  className="glosuj-btn"
                  onClick={handleImageClick(1)}
                  disabled={voteLoading}
                  type="button"
                >
                  <img src={glosujButton} alt="Głosuj" />
                </button>
              ) : (
                <div className="vote-result">
                  {formatVoteSummary(voteCounts.pic1Votes, voteTotal)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="vs-center">
          <img src={vsButton} alt="vs" className="vs-image" />
        </div>

        <div
          className="vote-section vote-section-bottom"
          style={{ backgroundImage: `url(${tloBottom})` }}
        >
          <div className="player-card player-card-bottom">
            <div className="player-footer">
              {voteCounts == null ? (
                <button
                  className="glosuj-btn"
                  onClick={handleImageClick(2)}
                  disabled={voteLoading}
                  type="button"
                >
                  <img src={glosujButton} alt="Głosuj" />
                </button>
              ) : (
                <div className="vote-result">
                  {formatVoteSummary(voteCounts.pic2Votes, voteTotal)}
                </div>
              )}
              <div className="player-name">{bottomImage.name}</div>
            </div>
            <img
              src={bottomImage.url}
              alt={bottomImage.alt}
              className="player-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PictureDisplay;
