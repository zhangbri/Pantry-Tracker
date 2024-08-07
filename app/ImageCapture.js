import React, { useRef, useEffect, useState } from 'react';
import { IconButton } from '@mui/material';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';

function ImageCapture({ onCapture, isFrontCamera, onFlipCamera }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isFrontCamera]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: isFrontCamera ? 'user' : 'environment' }
      });
      setStream(newStream);
      videoRef.current.srcObject = newStream;
    } catch (err) {
      console.error("Error accessing the camera", err);
    }
  };

  const captureImage = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 480, 360);
    const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
    onCapture(imageDataUrl);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <canvas ref={canvasRef} width={480} height={360} style={{ display: 'none' }} />
      <IconButton
        onClick={onFlipCamera}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <FlipCameraIosIcon />
      </IconButton>
    </div>
  );
}

export default ImageCapture;