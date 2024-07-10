import './App.css';
import SideBar from './SideBar';
import Slider from './Slider';
import { useState, useRef, useEffect, Suspense } from 'react';
import DEFAULT_OPTIONS from './util';
import { Box } from '@chakra-ui/react'
import { FaFileImage } from "react-icons/fa";
import Loader from './loader';


function getImageStyle(options) {
  const filters = options.map(option => {
    return `${option.property}(${option.value}${option.unit})`;
  }).join(' ');

  return { filter: filters };
}

function AppOld() {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [drawingStrokes, setDrawingStrokes] = useState([]);
  const selectedOption = options[selectedOptionIndex];
  const [enableDraw, setEnableDraw] = useState(false);
  const [brushColor, setBrushColor] = useState('black');
  const [brushWidth, setBrushWidth] = useState(5);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [iscropping,setIsCrropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cropRegion, setCropRegion] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const canvasRef = useRef(null);
  const cropOverlayRef = useRef(null);
  const imageOverlayRef = useRef(null);
  const ctxRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [presentIndex, setPresentIndex] = useState(-1);

  const addToHistory = (newImage) => {
    const newHistoy = {
      options: options,
      image: newImage,
      rotationAngle: rotationAngle
    }
    const updatedHistory = history.slice(0, presentIndex + 1);
    updatedHistory.push(newHistoy);
    setHistory(updatedHistory);
    setPresentIndex(updatedHistory.length - 1);
  };

  const handleBrushColorChange = (e) => {
    setBrushColor(e.target.value);
  };

  const handleBrushWidthChange = (e) => {
    setBrushWidth(parseInt(e.target.value, 10));
  };

  const handleResize = (newWidth, newHeight) => {
    setCanvasWidth(newWidth);
    setCanvasHeight(newHeight);
  };
  
  const handleMouseDownCrop = (e) => {
    if(!iscropping) return;
    const rect = cropOverlayRef.current.getBoundingClientRect();
    console.log("entered here : ",e.clientX,e.clientY);
    setStartCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
  };

  const handleMouseUpCrop = () => {
    if(!isDragging) return;
    setIsDragging(false);
    setIsCrropping(false);
    handleCrop();
  };

  const handleMouseMoveCrop = (e) => {
    if (!isDragging) return;

    const rect = cropOverlayRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const newWidth = currentX - startCoords.x;
    const newHeight = currentY - startCoords.y;

    console.log(" test : ", startCoords.x,startCoords.y,newWidth,newHeight);
    setCropRegion({ x: startCoords.x, y: startCoords.y, width: newWidth, height: newHeight });
    drawRectangle();
  };  

  const drawRectangle = () => {
    const overlay = cropOverlayRef.current;
    const ctx = overlay.getContext('2d');
    const { x, y, width, height } = cropRegion;

    ctx.clearRect(0, 0, overlay.width, overlay.height); // Clear the overlay canvas
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height); // Draw new rectangle
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');


    const { x, y, width, height } = cropRegion;

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    // Set the dimensions of the new canvas
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    // Draw the cropped image onto the new canvas
    // ctx.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    croppedCtx.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    ctx.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    croppedCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);
    //croppedCtx.filter = getImageStyle(DEFAULT_OPTIONS).filter;

    // Convert the cropped canvas to a data URL and save it in the state
    const croppedImage = croppedCanvas.toDataURL();
    setSelectedImage(croppedImage);

    // Update the main canvas with the cropped image
    canvas.width = width;
    canvas.height = height;
    setCanvasHeight(height);
    setCanvasWidth(width);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(croppedCanvas, 0, 0);

  };


  const handleUndo = () => {
    if (presentIndex > 0) {
      setPresentIndex(presentIndex - 1);
      console.log("handle undo")
      setSelectedImage(history[presentIndex-1].image);
      setRotationAngle(history[presentIndex-1].rotationAngle);
      setOptions(history[presentIndex-1].options);
    }
  };

  const handleRedo = () => {
    if (presentIndex < history.length - 1) {
      setPresentIndex(presentIndex + 1);
      setSelectedImage(history[presentIndex+1]);
    }
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    ctxRef.current = context;
    const imageWithFilters = new Image();
    const imageNoFilters = new Image();
    imageWithFilters.src = selectedImage ? selectedImage : require('./tree.jpg');
    //context.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    imageWithFilters.onload = () => {
      //context.filter = getImageStyle(options).filter;
      console.log("options in useeffect",options);
      context.drawImage(imageWithFilters, 0, 0, canvasWidth, canvasHeight);
      applyRotation(context, canvasWidth, canvasHeight, rotationAngle); // Apply rotation
      console.log("use effect");
    };  
    //context.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    const newCanvas = canvas.toDataURL();
    addToHistory(newCanvas);
    //context.filter = getImageStyle(options).filter;

    //addToHistory(imageNoFilters.src);  
  }, [canvasWidth, canvasHeight, rotationAngle,selectedImage]);


  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    ctxRef.current = context;
    const imageWithFilters = new Image();
    const imageNoFilters = new Image();
    imageWithFilters.src = selectedImage ? selectedImage : require('./tree.jpg');
    //context.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    imageWithFilters.onload = () => {
      context.filter = getImageStyle(options).filter;
      console.log("options in useeffect only filter",options);
      context.drawImage(imageWithFilters, 0, 0, canvasWidth, canvasHeight);
      applyRotation(context, canvasWidth, canvasHeight, rotationAngle); // Apply rotation
      console.log("use effect");
    };
    context.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    const newCanvas = canvas.toDataURL();
    addToHistory(newCanvas);
    context.filter = getImageStyle(options).filter;

    //addToHistory(imageNoFilters.src);  
  }, [options]);
  

  const handleSliderChange = ({ target }) => {
    const value = parseInt(target.value, 10); // Ensure the value is an integer
    setOptions(prevOptions => {
      return prevOptions.map((option, index) => {
        if (index !== selectedOptionIndex) return option;
        return { ...option, value: value };
      });
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modified_image.png'; // Set the filename for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleEnableDraw = () => {
    setEnableDraw(!enableDraw);
  };

  const startDrawing = ({ nativeEvent }) => {
    if (!enableDraw) return;
    const { offsetX, offsetY } = nativeEvent; 
    ctxRef.current.beginPath();   
    ctxRef.current.moveTo(offsetX, offsetY);   

    ctxRef.current.globalCompositeOperation = 'source-over';
    ctxRef.current.strokeStyle = brushColor;
    ctxRef.current.lineWidth = brushWidth;
    ctxRef.current.lineCap = 'round';

    setDrawing(true);
    setDrawingStrokes(prevStrokes => [
      ...prevStrokes,
      {
        color: ctxRef.current.strokeStyle,  
        width: ctxRef.current.lineWidth,
        points: [{ x: offsetX, y: offsetY }]
      }
    ]);
  };

  const finishDrawing = () => {
    if (!drawing) return;
    setDrawing(false);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.filter = getImageStyle(DEFAULT_OPTIONS).filter;
    const drawnImage = canvas.toDataURL();  
    setSelectedImage(drawnImage);
  };

  const draw = ({ nativeEvent }) => {
    if (!drawing) return; 
    const { offsetX, offsetY } = nativeEvent;   
    const newPoint = { x: offsetX, y: offsetY }; 
    const lastStroke = drawingStrokes[drawingStrokes.length - 1]; 
    lastStroke.points.push(newPoint); 
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };


  function applyRotation(context, canvasWidth, canvasHeight, angle) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const tempContext = canvas.getContext('2d');
  
    tempContext.translate(canvasWidth / 2, canvasHeight / 2); // Translate to center
    tempContext.rotate((angle * Math.PI) / 180); // Rotate by angle in radians
    tempContext.drawImage(canvasRef.current, -canvasWidth / 2, -canvasHeight / 2); // Draw rotated image
  
    context.clearRect(0, 0, canvasWidth, canvasHeight); // Clear original canvas
    context.drawImage(canvas, 0, 0); // Draw rotated image back to original canvas
  }


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };
  

  return (
    <Suspense fallback={<Loader/>}>
    <div className="container">
    <Box
      p={4}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
    >
      <canvas
        id='myCanvas'
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={enableDraw ? startDrawing : handleMouseDownCrop}
        onMouseUp={enableDraw ? finishDrawing : handleMouseUpCrop}
        onMouseMove={enableDraw ? draw: handleMouseMoveCrop}
        onMouseOut={enableDraw ? finishDrawing : handleMouseUpCrop}
      /> 
      <canvas
        id='myCanvas1'
        ref={cropOverlayRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={enableDraw ? startDrawing : handleMouseDownCrop}
        onMouseUp={enableDraw ? finishDrawing : handleMouseUpCrop}
        onMouseMove={enableDraw ? draw: handleMouseMoveCrop}
        onMouseOut={enableDraw ? finishDrawing : handleMouseUpCrop}
      />
      <canvas
        id='myCanvas2'
        ref={imageOverlayRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={enableDraw ? startDrawing : handleMouseDownCrop}
        onMouseUp={enableDraw ? finishDrawing : handleMouseUpCrop}
        onMouseMove={enableDraw ? draw: handleMouseMoveCrop}
        onMouseOut={enableDraw ? finishDrawing : handleMouseUpCrop}
      />
    </Box>
      <div className="sidebar">
        {options.map((option, index) => (
          <SideBar
            key={index}
            name={option.name}
            active={index === selectedOptionIndex}
            handleClick={() => {
              setSelectedOptionIndex(index);
            }}
          />
        ))}
          <label className="file-upload">
             Upload Image
            <input type="file" accept="image/*" onChange={handleImageChange} className="file-upload" />
            </label>
        <button onClick={handleDownload} className='button'>Download Modified Image</button>
        <button onClick={handleEnableDraw} className='button'>Drawing</button>

        <div>
          <label className='label'>
            Brush Color:
          </label>
            <input
              type="color"
              value={brushColor}
              onChange={handleBrushColorChange}
              className='input-field'
            />
        </div>
        <div>
          <label className='label'>
            Brush Width:
          </label>
            <input
              type="range"
              value={brushWidth}
              onChange={handleBrushWidthChange}
              min="1"
              max="100"
              className='input-field'
            />
        </div>

        <div>
  <label className='label'>
    Canvas Width:
  </label>
    <input
      type="number"
      value={canvasWidth}
      onChange={(e) => setCanvasWidth(parseInt(e.target.value))}
      className='input-field'
    />
</div>
<div>
  <label className='label'>
    Canvas Height:
  </label>
    <input
      type="number"
      value={canvasHeight}
      onChange={(e) => setCanvasHeight(parseInt(e.target.value))}
      className='input-field'
    />
</div>
<div>
  <label className='label'>
    Rotation Angle (degrees):
  </label>
  <input
  type="range"
  min="0"
  max="360"
  value={rotationAngle}
  onChange={(e) => setRotationAngle(parseInt(e.target.value))}
  className='input-field'
/>
</div>
<button onClick={() => handleResize(canvasWidth, canvasHeight)} className='button'>Resize Canvas</button>
<button onClick={() => setIsCrropping(true)} className='button'>Crop</button>
<button onClick={handleUndo} disabled={presentIndex <= 0} className='button'>Undo</button>
{/* <button onClick={handleRedo} disabled={presentIndex >= history.length - 1}>Redo</button> */}

      </div>
      <Slider
        min={selectedOption.range.min}
        max={selectedOption.range.max}
        value={selectedOption.value}
        handleChange={handleSliderChange}
      />
    </div>
</Suspense>
  );
}

export default AppOld;
