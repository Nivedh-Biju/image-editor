import { Box, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';
import React from 'react';
import './App.css';

const Slider = ({ min, max, value, handleChange }) => {
  return (
    <div className="slider-container">
      <span className="slider-value">{value}</span>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default Slider;
