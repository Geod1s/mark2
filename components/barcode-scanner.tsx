'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Scan, Search, X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  HybridBinarizer,
  BinaryBitmap
} from '@zxing/library';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ open, onOpenChange, onScan }: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* -------------------- INIT CAMERA & DEVICES -------------------- */
  useEffect(() => {
    if (!open) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());

        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(d => d.kind === 'videoinput');

        setDevices(videoDevices);
        setSelectedDeviceId(videoDevices[0]?.deviceId);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Camera permission denied or unavailable.');
      }
    };

    initCamera();
  }, [open]);

  /* -------------------- CLEANUP ON UNMOUNT/CLOSE -------------------- */
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts or dialog closes
      stopScanner();
    };
  }, []);

  /* -------------------- START / STOP SCANNING -------------------- */
  useEffect(() => {
    if (!open || !scanning || !selectedDeviceId || !videoRef.current) return;

    try {
      console.debug('[BarcodeScanner] starting continuous decode', { selectedDeviceId });
      readerRef.current = new BrowserMultiFormatReader();

      readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            console.debug('[BarcodeScanner] result', result.getText());
            onScan(result.getText());
            stopScanner();
            onOpenChange(false);
            return;
          }
          if (err) {
            // NotFoundException is expected while scanning frames, only log others
            if ((err as any).name !== 'NotFoundException') {
              console.error('[BarcodeScanner] decode error', err);
            }
          }
        }
      );
    } catch (err) {
      console.error('[BarcodeScanner] failed to start decodeFromVideoDevice', err);
      setError('Scanner failed to start. Please try the camera snapshot button.');
    }

    return () => {
      stopScanner();
    };
  }, [open, scanning, selectedDeviceId, onScan, onOpenChange]);

  /* -------------------- SCANNER CONTROL FUNCTIONS -------------------- */
  const stopScanner = () => {
    if (readerRef.current) {
      // Stop the reader if available (prefer stopContinuousDecode), fall back to reset if present
      if ((readerRef.current as any).stopContinuousDecode) {
        (readerRef.current as any).stopContinuousDecode();
      } else if ((readerRef.current as any).reset) {
        (readerRef.current as any).reset();
      }
      readerRef.current = null;
    }
    
    // Stop any active media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video source
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
  };

  const handleStartScanning = async () => {
    if (!selectedDeviceId) {
      setError('No camera device found.');
      return;
    }
    
    setError(null);
    
    try {
      // Get the video stream for the selected device
      const constraints = {
        video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
      
      setScanning(true);
    } catch (err) {
      console.error(err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  // Attempt a one-shot decode from the current video frame (fallback)
  const attemptSnapshotDecode = async () => {
    if (!videoRef.current) {
      setError('No video element available');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Create an image element from canvas
      const dataUrl = canvas.toDataURL('image/png');
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));

      const reader = readerRef.current || new BrowserMultiFormatReader();
      try {
        // decodeFromImageElement may be available on the reader (browser wrapper)
        // @ts-ignore
        const result = await reader.decodeFromImageElement(img);
        if (result) {
          console.debug('[BarcodeScanner] snapshot result (browser reader)', result.getText());
          onScan(result.getText());
          stopScanner();
          onOpenChange(false);
          return;
        }
      } catch (err) {
        console.debug('[BarcodeScanner] browser reader snapshot failed, will try manual decode', err);
      }

      // Manual decode using @zxing/library in case the browser wrapper method isn't available
      try {
        const makeBinaryBitmap = (imgData: ImageData) => {
          const luminanceSource = new RGBLuminanceSource(imgData.data as any, imgData.width, imgData.height);
          const binarizer = new HybridBinarizer(luminanceSource as any);
          return new BinaryBitmap(binarizer as any);
        }

        const tryDecodeWithImageData = (imgData: ImageData) => {
          const mfReader = new MultiFormatReader();
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.ITF,
            BarcodeFormat.QR_CODE
          ]);
          // @ts-ignore
          mfReader.setHints(hints);
          const binaryBitmap = makeBinaryBitmap(imgData);
          try {
            return mfReader.decode(binaryBitmap as any);
          } catch (e) {
            // rethrow so caller can inspect; NotFoundException is expected
            throw e;
          }
        }

        const canvasForDecode = document.createElement('canvas');
        canvasForDecode.width = video.videoWidth || canvas.width || 640;
        canvasForDecode.height = video.videoHeight || canvas.height || 480;
        const ctx2 = canvasForDecode.getContext('2d');
        if (!ctx2) throw new Error('Canvas context not available');
        ctx2.drawImage(video, 0, 0, canvasForDecode.width, canvasForDecode.height);
        const fullImageData = ctx2.getImageData(0, 0, canvasForDecode.width, canvasForDecode.height);

        const attempts: { label: string; imageData: ImageData }[] = [];
        attempts.push({ label: 'full', imageData: fullImageData });

        // center crop (50%)
        const cx = Math.floor(canvasForDecode.width / 4);
        const cy = Math.floor(canvasForDecode.height / 4);
        const cw = Math.floor(canvasForDecode.width / 2);
        const ch = Math.floor(canvasForDecode.height / 2);
        const centerCanvas = document.createElement('canvas');
        centerCanvas.width = cw;
        centerCanvas.height = ch;
        const cctx = centerCanvas.getContext('2d');
        if (cctx) {
          cctx.drawImage(canvasForDecode, cx, cy, cw, ch, 0, 0, cw, ch);
          attempts.push({ label: 'center', imageData: cctx.getImageData(0, 0, cw, ch) });
        }

        // upscaled center (2x) to help small barcodes
        const upCanvas = document.createElement('canvas');
        upCanvas.width = cw * 2;
        upCanvas.height = ch * 2;
        const uctx = upCanvas.getContext('2d');
        if (uctx) {
          uctx.imageSmoothingEnabled = true;
          uctx.drawImage(centerCanvas, 0, 0, cw, ch, 0, 0, cw * 2, ch * 2);
          attempts.push({ label: 'center-upscaled', imageData: uctx.getImageData(0, 0, upCanvas.width, upCanvas.height) });
        }

        // Simple preprocessing: grayscale + contrast boost
        const preprocess = (imgData: ImageData, contrast = 1.6) => {
          const out = new ImageData(imgData.width, imgData.height);
          const d = imgData.data;
          const od = out.data;
          for (let i = 0; i < d.length; i += 4) {
            // luminance
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            // contrast adjustment around 128
            let c = Math.round((lum - 128) * contrast + 128);
            if (c < 0) c = 0;
            if (c > 255) c = 255;
            od[i] = od[i + 1] = od[i + 2] = c;
            od[i + 3] = d[i + 3];
          }
          return out;
        }

        try {
          attempts.push({ label: 'preprocessed-full', imageData: preprocess(fullImageData) });
        } catch (e) {
          console.debug('[BarcodeScanner] preprocessing failed', e);
        }

        // rotated attempt (90deg)
        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = canvasForDecode.height;
        rotCanvas.height = canvasForDecode.width;
        const rctx = rotCanvas.getContext('2d');
        if (rctx) {
          rctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rctx.rotate((90 * Math.PI) / 180);
          rctx.drawImage(canvasForDecode, -canvasForDecode.width / 2, -canvasForDecode.height / 2);
          attempts.push({ label: 'rotated', imageData: rctx.getImageData(0, 0, rotCanvas.width, rotCanvas.height) });
        }

        // Try each attempt until one decodes
        for (const attempt of attempts) {
          try {
            console.debug('[BarcodeScanner] manual decode attempt', attempt.label);
            const res = tryDecodeWithImageData(attempt.imageData as ImageData);
            if (res) {
              console.debug('[BarcodeScanner] snapshot result (manual decode)', res.getText());
              onScan(res.getText());
              stopScanner();
              onOpenChange(false);
              return;
            }
          } catch (err) {
            // Log and continue; NotFoundException is expected if no barcode found
            console.debug('[BarcodeScanner] attempt failed', attempt.label, err);
          }
        }

        // If we reached here, no attempts succeeded
        setError('No barcode detected in the snapshot. Try moving closer, improving lighting, or using a different camera.');
      } catch (err) {
        console.error('[BarcodeScanner] manual snapshot decode failed', err);
        setError('No barcode detected in the snapshot. Try moving closer or improving lighting.');
      }
    } catch (err) {
      console.error('[BarcodeScanner] snapshot error', err);
      setError('Snapshot failed. Please try again.');
    }
  };

  const handleStopScanning = () => {
    stopScanner();
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (!manualBarcode.trim()) return;
    onScan(manualBarcode.trim());
    setManualBarcode('');
    onOpenChange(false);
  };

  /* -------------------- UI -------------------- */
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        stopScanner();
        setScanning(false);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Product Barcode</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* Manual Entry */}
          <div className="space-y-2">
            <Label>Enter Barcode Manually</Label>
            <div className="flex gap-2">
              <Input
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualBarcode.trim()) {
                    handleManualSubmit();
                  }
                }}
              />
              <Button onClick={handleManualSubmit} disabled={!manualBarcode.trim()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Camera Selector */}
          {devices.length > 0 && (
            <div className="space-y-2">
              <Label>Camera Device</Label>
              <select
                value={selectedDeviceId ?? ''}
                onChange={(e) => {
                  if (scanning) {
                    handleStopScanning();
                  }
                  setSelectedDeviceId(e.target.value);
                }}
                className="w-full p-2 border rounded"
              >
                {devices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scanner */}
          <div className="space-y-2">
            <Label>Scan Barcode</Label>

            <div className="relative border rounded-lg overflow-hidden bg-black min-h-[300px]">
              {scanning ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed rounded-xl w-3/4 h-3/4 flex items-center justify-center">
                      <div className="text-center text-white bg-black/50 p-4 rounded-lg">
                        <Scan className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Align barcode in frame</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-[300px] flex flex-col items-center justify-center p-8 text-center">
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {!scanning ? (
              <Button 
                className="w-full" 
                onClick={handleStartScanning} 
                disabled={!devices.length}
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  variant="destructive" 
                  onClick={handleStopScanning}
                >
                  <X className="h-4 w-4 mr-2" />
                  Stop Scanning
                </Button>
                <Button className="w-36" onClick={attemptSnapshotDecode}>
                  Try Snapshot
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}