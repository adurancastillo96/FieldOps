/**
 * Camera Capture service for FieldOps PWA.
 */
const FieldOpsCamera = (function() {
    let stream = null;
    const video = document.getElementById('viewfinder');
    const canvas = document.getElementById('viewfinder-canvas');
    const captureOverlay = document.getElementById('capture-overlay');

    async function startCamera() {
        console.log("Starting camera stream...");
        try {
            // Request rear camera for mobile, fallback to any video source
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });
            video.srcObject = stream;
            video.play();
            captureOverlay.classList.remove('hidden');
            console.log("Camera stream started successfully");
            return true;
        } catch (error) {
            console.error("Error accessing camera: ", error);
            // Display alert or mock stream for desktop browser tests
            alert("No se pudo acceder a la cámara. Usando cámara simulada para demostración.");
            setupMockViewfinder();
            return false;
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null;
            console.log("Camera stream stopped");
        }
    }

    function setupMockViewfinder() {
        // Mocking canvas render for testing/desktop environments
        const ctx = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 480;
        
        // Render simple simulated field view
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#06b6d4';
        ctx.font = '20px Outfit';
        ctx.fillText('Cámara de Campo Simulada (FieldOps)', 50, 240);
        
        captureOverlay.classList.remove('hidden');
    }

    function capturePhoto() {
        const ctx = canvas.getContext('2d');
        
        if (stream) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
            // Draw mock image if real stream is inactive
            setupMockViewfinder();
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, 640, 480);
            ctx.fillStyle = '#10b981';
            ctx.font = '24px JetBrains Mono';
            ctx.fillText('DISPOSITIVO ONT MOCK', 180, 200);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px JetBrains Mono';
            ctx.fillText('MAC: 48:8F:4C:AA:BB:CC', 180, 250);
            ctx.fillText('MODEL: HG8145V5', 180, 280);
        }

        // Return base64 string
        return canvas.toDataURL('image/jpeg', 0.85);
    }

    return {
        start: startCamera,
        stop: stopCamera,
        capture: capturePhoto
    };
})();
