import React from 'react';

import glownaIcon from '../design/belka/glowna.png';
import poczekalniaIcon from '../design/belka/poczekalnia.png';
import topkaIcon from '../design/belka/topka.png';
import kategorieIcon from '../design/belka/kategorie.png';
import losujIcon from '../design/belka/losuj.png';
import dodajIcon from '../design/belka/dodaj.png';

const NAV_ITEMS = [
  { id: 'glowna', label: 'GŁÓWNA', icon: glownaIcon },
  { id: 'poczekalnia', label: 'POCZEKALNIA', icon: poczekalniaIcon },
  { id: 'topka', label: 'TOPKA', icon: topkaIcon },
  { id: 'kategorie', label: 'KATEGORIE', icon: kategorieIcon },
  { id: 'losuj', label: 'LOSUJ', icon: losujIcon },
];

function BottomBar() {
  return (
    <nav className="bottom-bar" aria-label="Nawigacja">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="bottom-bar__item"
          aria-label={item.label}
        >
          <img src={item.icon} alt="" className="bottom-bar__icon" aria-hidden="true" />
          <span className="bottom-bar__label">{item.label}</span>
        </button>
      ))}
      <span className="bottom-bar__divider" aria-hidden="true" />
      <button type="button" className="bottom-bar__item bottom-bar__item--dodaj" aria-label="DODAJ">
        <img src={dodajIcon} alt="" className="bottom-bar__icon" aria-hidden="true" />
        <span className="bottom-bar__label">DODAJ</span>
      </button>
    </nav>
  );
}

export default BottomBar;
