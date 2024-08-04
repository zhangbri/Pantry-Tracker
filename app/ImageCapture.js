import React, { useRef, useEffect } from 'react';
import { Button } from '@mui/material';

function ImageCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing the camera", err);
    }
  };

  const captureImage = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
    onCapture(imageDataUrl);
  };

  return (
    <>
      <video ref={videoRef} width="640" height="480" autoPlay style={{ display: 'block', borderRadius: '15px' }} />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      <Button 
        id="captureButton" 
        onClick={captureImage} 
        style={{ display: 'none' }}
      >
        Capture
      </Button>
    </>
  );
}

export default ImageCapture;