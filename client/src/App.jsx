// client/src/App.jsx
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

// Csatlakozás a backendhez
const socket = io.connect("https://rajzolo.onrender.com");

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Színválasztó state
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    const canvas = canvasRef.current;
    
    // Canvas méretezése ablakméretre (Retina kijelző támogatással)
    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2); // Kétszeres felbontás az élességért
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctxRef.current = ctx;

    // Esemény figyelése: ha más rajzol, mi is rajzoljuk ki
    socket.on("draw_line", ({ prevPoint, currentPoint, color }) => {
      const ctx = ctxRef.current;
      const savedColor = ctx.strokeStyle; // Mentsük el a mi színünket
      
      ctx.strokeStyle = color; // Váltsunk a másik user színére
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      
      ctx.strokeStyle = savedColor; // Állítsuk vissza a mi színünket
    });

    // Cleanup: leiratkozás az eseményről, ha a komponens megszűnik
    return () => socket.off("draw_line");
  }, []);

  // Szín frissítése, ha a user vált
  useEffect(() => {
    if(ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  // RAJZOLÁSI LOGIKA
  // Kell egy referencia az előző pontra, hogy vonalat tudjunk húzni
  const prevPoint = useRef(null);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);
    prevPoint.current = { x: offsetX, y: offsetY };
  }

  const finishDrawing = () => {
    setIsDrawing(false);
    prevPoint.current = null;
    ctxRef.current.beginPath(); // Új útvonal kezdése (hogy ne kösse össze a vonalakat)
  }

  const draw = (e) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const currentPoint = { x: offsetX, y: offsetY };

    // 1. Rajzolás a saját vásznunkra
    ctxRef.current.lineTo(currentPoint.x, currentPoint.y);
    ctxRef.current.stroke();
    
    // 2. Adatok küldése a szervernek (hogy mások is lássák)
    if (prevPoint.current) {
        socket.emit("draw_line", {
            prevPoint: prevPoint.current,
            currentPoint,
            color: color
        });
    }

    // Frissítjük az előző pontot a mostanira
    prevPoint.current = currentPoint; 
  }

  return (
    <div className="App">
      <div className="toolbar">
        <h3>🎨 LiveBoard</h3>
        <input 
          type="color" 
          value={color} 
          onChange={(e) => setColor(e.target.value)} 
        />
        <span className="status">● Élő kapcsolat</span>
      </div>
      <canvas
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        ref={canvasRef}
      />
    </div>
  );
}

export default App;