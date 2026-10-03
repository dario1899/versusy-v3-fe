import React, { useState, useEffect, useCallback, useRef } from 'react';
import './PictureDisplay.css';

import {
  fetchVersusesCount,
  fetchVersusByIndex,
  fetchVersusNext,
  fetchVersusPrevious,
  postVersusVote,
} from '../api/client';
import { normalizeVersusToPlayers, formatVersusTag } from '../utils/versusPayload';
import TagBar from './TagBar';
import BottomBar from './BottomBar';
import { formatVotePercent, getVotePercent } from '../utils/voteFormat';
import { RESULTS_DISPLAY_MS } from '../config';

import vsButton from '../design/vs-button.png';
import leftArrow from '../design/left-arrow.png';
import rightArrow from '../design/right-arrow.png';

/**
 * Ring around the VS button that drains while the results are shown.
 * Coordinates are in % of the VS image: the VS circle artwork has a radius of ~38, so r=40 hugs it.
 */
const RESULTS_TIMER_RADIUS = 40;

function ResultsTimer({ durationMs }) {
  return (
    <svg className="results-timer" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="results-timer__track" cx="50" cy="50" r={RESULTS_TIMER_RADIUS} />
      <circle
        className="results-timer__progress"
        cx="50"
        cy="50"
        r={RESULTS_TIMER_RADIUS}
        pathLength="100"
        style={{ animationDuration: `${durationMs}ms` }}
      />
    </svg>
  );
}

/** This side's share of the votes. Its row is always reserved so the layout doesn't jump after voting. */
function VoteResult({ placement, votes, totalVotes, voted }) {
  const percent = getVotePercent(votes, totalVotes);
  return (
    <div className="vote-result-row" aria-hidden={!voted}>
      {voted ? (
        <span className={`vote-result vote-result--${placement}`}>
          <span
            className="vote-result__fill"
            style={{ width: `${percent}%` }}
            aria-hidden="true"
          />
          <span className="vote-result__label">{percent}%</span>
        </span>
      ) : null}
    </div>
  );
}

/** The whole picture card is the vote button. */
function PlayerCard({ player, placement, votes, totalVotes, voted, onVote, disabled }) {
  const name = <div className="player-name">{player.name}</div>;
  const image = (
    <div className="player-image-wrap">
      <img src={player.url} alt={player.alt} className="player-image" />
    </div>
  );

  return (
    <button
      type="button"
      className={`player-card player-card-${placement}`}
      onClick={voted ? undefined : onVote}
      disabled={disabled || voted}
      aria-label={
        voted
          ? `${player.name}: ${formatVotePercent(votes, totalVotes)}`
          : `Głosuj na ${player.name}`
      }
    >
      {placement === 'top' ? (
        <>
          {image}
          {name}
        </>
      ) : (
        <>
          {name}
          {image}
        </>
      )}
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
  /** No previous versus available from current position. */
  const [canGoPrevious, setCanGoPrevious] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [voteLoading, setVoteLoading] = useState(false);
  const [versusTag, setVersusTag] = useState('#');
  const blobUrlsRef = useRef([]);

  const applyVersusData = useCallback((data) => {
    const { players, objectUrls } = normalizeVersusToPlayers(data);
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = objectUrls;
    const id = data.id ?? data.versusId;
    if (id != null) setCurrentVersusId(id);
    setImages(players);
    setVersusTag(formatVersusTag(data));
    setVoteCounts(null);
    setVoteError('');
    setAllVersusSeen(false);
  }, []);

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
    setCanGoPrevious(false);

    try {
      const data = await fetchVersusByIndex(targetId);
      if (aborted()) return;
      applyVersusData(data);
      if (data.id == null && data.versusId == null) {
        setCurrentVersusId(targetId);
      }
    } catch (e) {
      if (aborted()) return;
      if (e.entityNotFound) {
        setAllVersusSeen(true);
        setVersusTag('#');
        setImages([]);
      } else {
        setError(e?.message || 'Nie udało się załadować versus.');
        setAllVersusSeen(false);
      }
    } finally {
      if (!aborted()) setLoading(false);
    }
  }, [applyVersusData]);

  const navigateVersus = useCallback(
    async (direction) => {
      if (direction === 'next' && allVersusSeen) return;

      // From end screen, left restores the last versus the user was viewing.
      if (direction === 'previous' && allVersusSeen) {
        setLoading(true);
        setError('');
        setVoteError('');
        setVoteCounts(null);

        try {
          const data = await fetchVersusByIndex(currentVersusId);
          applyVersusData(data);
          setCanGoPrevious(true);
        } catch (e) {
          setError(e?.message || 'Nie udało się załadować versus.');
        } finally {
          setLoading(false);
        }
        return;
      }

      if (direction === 'previous' && !canGoPrevious) return;

      setLoading(true);
      setError('');
      setVoteError('');
      setVoteCounts(null);

      try {
        const data =
          direction === 'next'
            ? await fetchVersusNext(currentVersusId)
            : await fetchVersusPrevious(currentVersusId);
        applyVersusData(data);
        if (direction === 'next') {
          setCanGoPrevious(true);
        }
      } catch (e) {
        if (direction === 'next' && e.entityNotFound) {
          setAllVersusSeen(true);
          setVersusTag('#');
          setImages([]);
        } else if (direction === 'previous' && e.entityNotFound) {
          setCanGoPrevious(false);
        } else {
          setError(e?.message || 'Nie udało się załadować versus.');
        }
      } finally {
        setLoading(false);
      }
    },
    [allVersusSeen, canGoPrevious, currentVersusId, applyVersusData]
  );

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

  // After a vote, show the results for RESULTS_DISPLAY_MS, then move on to the next versus.
  // Navigating away earlier resets voteCounts, which cancels the timer.
  const navigateVersusRef = useRef(navigateVersus);
  navigateVersusRef.current = navigateVersus;
  useEffect(() => {
    if (voteCounts == null) return undefined;
    const timer = setTimeout(() => navigateVersusRef.current('next'), RESULTS_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [voteCounts]);

  const handleNextVersus = useCallback(async () => {
    await navigateVersus('next');
  }, [navigateVersus]);

  const handlePrevVersus = useCallback(async () => {
    await navigateVersus('previous');
  }, [navigateVersus]);

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
      <VoteAppShell tag="#">
        <div className="vote-screen">
          <div className="vote-frame vote-frame--nav-only">
          <button
            className="nav-arrow nav-arrow-left"
            onClick={handlePrevVersus}
            disabled={voteLoading}
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
          disabled={voteLoading || !canGoPrevious}
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

        <div className="vote-section vote-section-top">
          <PlayerCard
            player={topImage}
            placement="top"
            votes={voteCounts?.pic1Votes ?? 0}
            totalVotes={voteTotal}
            voted={voteCounts != null}
            onVote={handleImageClick(1)}
            disabled={voteLoading}
          />
          <VoteResult
            placement="top"
            votes={voteCounts?.pic1Votes ?? 0}
            totalVotes={voteTotal}
            voted={voteCounts != null}
          />
        </div>

        <div className="vs-center">
          <img src={vsButton} alt="vs" className="vs-image" />
          {voteCounts != null ? (
            <ResultsTimer key={currentVersusId} durationMs={RESULTS_DISPLAY_MS} />
          ) : null}
        </div>

        <div className="vote-section vote-section-bottom">
          <VoteResult
            placement="bottom"
            votes={voteCounts?.pic2Votes ?? 0}
            totalVotes={voteTotal}
            voted={voteCounts != null}
          />
          <PlayerCard
            player={bottomImage}
            placement="bottom"
            votes={voteCounts?.pic2Votes ?? 0}
            totalVotes={voteTotal}
            voted={voteCounts != null}
            onVote={handleImageClick(2)}
            disabled={voteLoading}
          />
        </div>
        </div>
      </div>
    </VoteAppShell>
  );
};

export default PictureDisplay;
