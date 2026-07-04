import React from 'react';
import tagIcon from '../design/belka/kategorie.png';

function TagBar({ tag = '#' }) {
  const label = tag && String(tag).trim() ? String(tag).trim() : '#';

  return (
    <div className="tag-bar">
      <div className="tag-bar__pill">
        <img src={tagIcon} alt="" className="tag-bar__icon" aria-hidden="true" />
        <span className="tag-bar__text">{label}</span>
      </div>
    </div>
  );
}

export default TagBar;
