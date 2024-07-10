import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

function App() {
  const canvasRef = useRef(null);
  const [selectedObject, setSelectedObject] = useState(null);

  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = new fabric.Canvas('canvas');
      canvasRef.current = canvas;

      const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'red',
        width: 100,
        height: 100,
        selectable: true,
        onSelect: function() {
          setSelectedObject(this);
        },
        onDeselect: function() {
          setSelectedObject(null);
        }
      });

      canvas.add(rect);

      // Handle selection events at the canvas level
      canvas.on('selection:created', (e) => {
        if (e.selected && e.selected.length > 0) {
          setSelectedObject(e.selected[0]);
        }
      });

      canvas.on('selection:updated', (e) => {
        if (e.selected && e.selected.length > 0) {
          setSelectedObject(e.selected[0]);
        }
      });

      canvas.on('before:selection:cleared', () => {
        setSelectedObject(null);
      });
    }
  }, []);

  // Function to handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      addImage(url);
    };
    reader.readAsDataURL(file);
  };

  // Function to add an image to the canvas
  const addImage = (url) => {
    fabric.Image.fromURL(url, (img) => {
      img.set({
        left: 50,
        top: 50,
        angle: 0,
        padding: 10,
        cornersize: 10,
        hasControls: true,
        hasBorders: true,
        selectable: true,
        onSelect: function() {
          setSelectedObject(this);
        },
        onDeselect: function() {
          setSelectedObject(null);
        }
      });
      canvasRef.current.add(img);
    });
  };

  // Function to change color of the selected object
  const changeColor = () => {
    if (selectedObject && selectedObject.type === 'rect') {
      selectedObject.set('fill', 'blue');
      canvasRef.current.renderAll();
    }
  };

  // Function to delete the selected object
  const deleteObject = () => {
    if (selectedObject) {
      canvasRef.current.remove(selectedObject);
      setSelectedObject(null);
    }
  };

  // Function to move the selected object
  const moveObject = (direction) => {
    if (selectedObject) {
      const step = 10;
      switch (direction) {
        case 'left':
          selectedObject.set('left', selectedObject.left - step);
          break;
        case 'right':
          selectedObject.set('left', selectedObject.left + step);
          break;
        case 'up':
          selectedObject.set('top', selectedObject.top - step);
          break;
        case 'down':
          selectedObject.set('top', selectedObject.top + step);
          break;
        default:
          break;
      }
      canvasRef.current.renderAll();
    }
  };

  return (
    <div>
      <canvas id="canvas" width="800" height="600" style={{ border: '1px solid black' }}></canvas>
      <div>
        <input type="file" accept="image/*" onChange={handleFileInputChange} />
        {selectedObject && (
          <div>
            <button onClick={changeColor}>Change Color</button>
            <button onClick={deleteObject}>Delete Object</button>
            <button onClick={() => moveObject('left')}>Move Left</button>
            <button onClick={() => moveObject('right')}>Move Right</button>
            <button onClick={() => moveObject('up')}>Move Up</button>
            <button onClick={() => moveObject('down')}>Move Down</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
