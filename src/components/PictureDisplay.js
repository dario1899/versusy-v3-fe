import React, { useState, useEffect } from 'react';
import './PictureDisplay.css';

import { mockImageSets, mockTextSets } from './mockData';

// Design assets
import glosujButton from '../design/glosuj-button.png';
import vsButton from '../design/vs-button.png';
import leftArrow from '../design/left-arrow.png';
import rightArrow from '../design/right-arrow.png';
import tloTop from '../design/tlo1.png';
import tloBottom from '../design/tlo2.png';

const PictureDisplay = () => {
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentSet, setCurrentSet] = useState(0);

  // Load images for current set
  useEffect(() => {
    const loadImages = () => {
      setLoading(true);
      setTexts({}); // Clear previous texts
      // Simulate API delay
      setTimeout(() => {
        setImages(mockImageSets[currentSet]);
        setLoading(false);
      }, 1);
    };

    loadImages();
  }, [currentSet]);

  // Handle image click - show text on BOTH pictures
  const handleImageClick = (imageId) => () => {
    // Simulate API delay
    console.log(imageId);
    setTimeout(() => {
      const currentTexts = mockTextSets[currentSet];
      setTexts({
        1: currentTexts[1],
        2: currentTexts[2]
      });
    }, 300);
  };

  // Handle next versus button click
  const handleNextVersus = () => {
    const nextSet = (currentSet + 1) % mockImageSets.length;
    setCurrentSet(nextSet);
  };

  const handlePrevVersus = () => {
    const prevSet =
      (currentSet - 1 + mockImageSets.length) % mockImageSets.length;
    setCurrentSet(prevSet);
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading images...</p>
      </div>
    );
  }

  const topImage = images[0];
  const bottomImage = images[1];

  return (
    <div className="vote-screen">
      <div className="vote-frame">
        {/* Left / Right navigation arrows */}
        <button
          className="nav-arrow nav-arrow-left"
          onClick={handlePrevVersus}
          aria-label="Previous versus"
        >
          <img src={leftArrow} alt="previous" />
        </button>
        <button
          className="nav-arrow nav-arrow-right"
          onClick={handleNextVersus}
          aria-label="Next versus"
        >
          <img src={rightArrow} alt="next" />
        </button>

        {/* Top player section */}
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
              <button className="glosuj-btn" onClick={handleImageClick("image1")}>
                <img src={glosujButton} alt="Głosuj" />
              </button>
              {texts[topImage.id] && (
                <div className="vote-result">{texts[topImage.id]}</div>
              )}
            </div>
          </div>
        </div>

        {/* Center VS badge */}
        <div className="vs-center">
          <img src={vsButton} alt="vs" className="vs-image" />
        </div>

        {/* Bottom player section */}
        <div
          className="vote-section vote-section-bottom"
          style={{ backgroundImage: `url(${tloBottom})` }}
        >
          <div className="player-card player-card-bottom">
            <div className="player-footer">
              <button className="glosuj-btn" onClick={handleImageClick("image2")}>
                <img src={glosujButton} alt="Głosuj" />
              </button>
              <div className="player-name">{bottomImage.name}</div>
              {texts[bottomImage.id] && (
                <div className="vote-result">{texts[bottomImage.id]}</div>
              )}
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