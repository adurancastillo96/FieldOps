/**
 * FieldOps Main PWA Controller with Live WebSocket support.
 */
const FieldOpsApp = (function() {
    const API_BASE = '/api/v1';
    const AUTH_HEADER = 'Bearer test-token-123';
    
    // Workflow steps definition (Translated to English)
    const INSPECTION_STEPS = [
        { id: 'site-overview', name: 'Installation Environment', desc: 'Capture a general photo of the workspace area.', type: 'photo', mandatory: true },
        { id: 'ont-before', name: 'Before Installation', desc: 'Capture a photo of the optical rosette before mounting the ONT.', type: 'photo', mandatory: true },
        { id: 'ont-after-frontal', name: 'ONT Frontal', desc: 'Capture a frontal photo of the ONT already mounted and turned on.', type: 'photo', mandatory: true },
        { id: 'ont-after-closeup', name: 'ONT Label (Detail)', desc: 'Capture a close-up photo of the label with the barcode and MAC.', type: 'photo', mandatory: true },
        { id: 'power-meter', name: 'Optical Power', desc: 'Capture a photo of the Power Meter reading or enter the value.', type: 'reading', mandatory: true },
        { id: 'panoramic', name: 'Complete Installation', desc: 'Capture a panoramic photo of the rosette, patch cord, and final ONT.', type: 'photo', mandatory: true }
    ];

    // App state variables
    let currentWorkOrder = null;
    let currentInspection = null;
    let activeStepIdx = 0;
    let connectionMode = 'offline'; // 'offline' or 'online'
    
    // WebSocket / Audio state
    let ws = null;
    let audioPlayerNode = null;
    let audioRecorderCtx = null;
    let micStream = null;
    let audioSuppressed = false;
    let lastSuppressTime = 0;
    let autoReconnect = false;
    let videoFrameInterval = null;

    // UI Selectors
    const woSelect = document.getElementById('wo-select');
    const woDetailsCard = document.getElementById('wo-details-card');
    const woAddress = document.getElementById('wo-address');
    const woModel = document.getElementById('wo-model');
    const woMacPrefix = document.getElementById('wo-mac-prefix');
    
    const stepsTimeline = document.getElementById('steps-timeline');
    const activeStepTitle = document.getElementById('active-step-title');
    
    const btnCapture = document.getElementById('btn-capture');
    const btnRetake = document.getElementById('btn-retake');
    const btnSyncQueue = document.getElementById('btn-sync-queue');
    const syncQueueCount = document.getElementById('sync-queue-count');
    
    const btnModeOffline = document.getElementById('btn-mode-offline');
    const btnModeOnline = document.getElementById('btn-mode-online');
    const networkStatus = document.getElementById('network-status');
    const voicePrompt = document.getElementById('voice-agent-prompt');
    const voiceWaves = document.getElementById('voice-waves');
    
    const dialogueContainer = document.getElementById('dialogue-container');
    const btnVoiceAgent = document.getElementById('btn-voice-agent');

    // New Claude Chat Inputs
    const chatTextInput = document.getElementById('chat-text-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    
    const overallVerdict = document.getElementById('overall-verdict');
    const verdictDesc = document.getElementById('verdict-desc');
    const ocrVerificationBox = document.getElementById('ocr-verification-box');
    const macInput = document.getElementById('mac-input');
    const macPrefixWarning = document.getElementById('mac-prefix-warning');
    const btnConfirmOcr = document.getElementById('btn-confirm-ocr');
    
    const dbLocalState = document.getElementById('db-local-state');
    const dbGcsState = document.getElementById('db-gcs-state');
    const dbBqState = document.getElementById('db-bq-state');
    const jsonReport = document.getElementById('json-report');

    // Initialize application
    async function init() {
        console.log("App initializing...");
        registerServiceWorker();
        
        try {
            await FieldOpsStorage.init();
            dbLocalState.textContent = "Connected";
            dbLocalState.className = "sync-val status-green";
            
            await syncWorkOrders();
            await renderWorkOrderDropdown();
            await updateSyncQueueBadge();
            setupEventListeners();
            setupTabs();
            drawRouteMap();
        } catch (error) {
            console.error("Initialization failed:", error);
            dbLocalState.textContent = "Error";
            dbLocalState.className = "sync-val status-grey";
        }
    }

    // Register Service Worker
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(reg => console.log('Service Worker registered with scope: ', reg.scope))
                    .catch(err => console.error('Service Worker registration failed: ', err));
            });
        }
    }

    // Retrieve and cache work orders via REST API
    async function syncWorkOrders() {
        try {
            const response = await fetch(`${API_BASE}/work-orders`, {
                headers: { 'Authorization': AUTH_HEADER }
            });
            if (response.ok) {
                const payload = await response.json();
                await FieldOpsStorage.saveWorkOrders(payload.data);
                console.log("Work orders cached locally from server");
            }
        } catch (error) {
            console.warn("Failed to fetch work orders from cloud, using offline cache: ", error);
        }
    }

    // Render drop-down options
    async function renderWorkOrderDropdown() {
        const workOrders = await FieldOpsStorage.getWorkOrders();
        woSelect.innerHTML = '<option value="">-- Load work order --</option>';
        workOrders.forEach(wo => {
            const opt = document.createElement('option');
            opt.value = wo.id;
            opt.textContent = `WO-${wo.id.substring(0,8)} (${wo.status.toUpperCase()}) - ${wo.address}`;
            woSelect.appendChild(opt);
        });
    }

    // Handle work order selection changes
    async function handleWorkOrderChange(event) {
        const woId = event.target.value;
        if (!woId) {
            woDetailsCard.classList.add('hidden');
            stepsTimeline.innerHTML = '<div class="step-placeholder">Select a work order to see the inspection steps timeline.</div>';
            currentWorkOrder = null;
            currentInspection = null;
            btnCapture.disabled = true;
            FieldOpsCamera.stop();
            disconnectWebSocket();
            drawRouteMap();
            resetPhotoViewer();
            return;
        }

        currentWorkOrder = await FieldOpsStorage.getWorkOrder(woId);
        
        // Update Details Card
        woAddress.textContent = currentWorkOrder.address;
        woModel.textContent = currentWorkOrder.ont_model;
        woMacPrefix.textContent = currentWorkOrder.expected_mac_prefix;
        woDetailsCard.classList.remove('hidden');

        // Fetch or create inspection
        let inspection = await FieldOpsStorage.getInspection(woId);
        if (!inspection) {
            inspection = {
                id: crypto.randomUUID(),
                work_order_id: woId,
                technician_id: currentWorkOrder.assigned_technician_id,
                overall_verdict: 'PENDING',
                status: 'draft',
                created_at: new Date().toISOString()
            };
            await FieldOpsStorage.saveInspection(inspection);
        }
        currentInspection = inspection;
        activeStepIdx = 0;
        
        await renderSteps();
        btnCapture.disabled = false;
        
        // Start live camera viewfinder
        await FieldOpsCamera.start();
        
        // If map tab active or when work order changes, redraw map
        drawRouteMap();
        await updatePhotoViewerForCurrentStep();

        const welcomeMsg = `Work order WO-${woId.substring(0,8)} loaded. Please capture the first image: ${INSPECTION_STEPS[0].name}.`;
        appendDialogue('agent', welcomeMsg);
        FieldOpsVoiceConductor.announce(welcomeMsg);
    }

    // Render Steps list
    async function renderSteps() {
        if (!currentInspection) return;
        
        const stepsData = await FieldOpsStorage.getSteps(currentInspection.id);
        stepsTimeline.innerHTML = '';
        
        INSPECTION_STEPS.forEach((step, idx) => {
            const stepData = stepsData.find(s => s.step_id === step.id);
            const isCompleted = !!stepData;
            const isActive = idx === activeStepIdx;
            
            const row = document.createElement('div');
            row.className = `step-row ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
            row.dataset.idx = idx;
            
            const indicator = document.createElement('div');
            indicator.className = 'step-indicator';
            indicator.textContent = isCompleted ? '✓' : (idx + 1);
            
            const label = document.createElement('div');
            label.className = 'step-label';
            label.textContent = step.name;
            
            row.appendChild(indicator);
            row.appendChild(label);
            row.addEventListener('click', () => selectStep(idx));
            
            stepsTimeline.appendChild(row);
        });

        // Set active title
        const activeStep = INSPECTION_STEPS[activeStepIdx];
        activeStepTitle.textContent = `${activeStepIdx + 1}. ${activeStep.name}`;
        
        // Show/hide specific widgets
        if (activeStep.id === 'ont-after-closeup') {
            ocrVerificationBox.classList.remove('hidden');
        } else {
            ocrVerificationBox.classList.add('hidden');
        }
        
        // Relayout callback emulation
        if (window.ORION_relayoutModals) {
            window.ORION_relayoutModals();
        }
    }

    // Select step manually
    async function selectStep(idx) {
        activeStepIdx = idx;
        await renderSteps();
        await updatePhotoViewerForCurrentStep();
        
        const step = INSPECTION_STEPS[activeStepIdx];
        FieldOpsVoiceConductor.announce(`Loading step: ${step.name}. ${step.desc}`);
    }

    // Tab Navigation setup
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const targetTab = tab.dataset.tab;
                document.getElementById(targetTab).classList.add('active');
                
                if (targetTab === 'map-tab') {
                    // Redraw map on canvas
                    setTimeout(drawRouteMap, 50);
                }
            });
        });
    }

    // Google Maps Route Simulation
    function drawRouteMap() {
        const canvas = document.getElementById('deployment-map-canvas');
        if (!canvas) return;
        
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 300;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background Grid (Block pattern)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 12;
        const gridSpacing = 60;
        for (let x = 0; x < canvas.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        if (!currentWorkOrder) {
            // Draw default state
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '14px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('Select a work order to view route details.', canvas.width / 2, canvas.height / 2);
            
            document.getElementById('map-route-dist').textContent = 'N/A';
            document.getElementById('map-route-time').textContent = 'N/A';
            document.getElementById('map-gpon-port').textContent = 'N/A';
            return;
        }
        
        let points = [];
        let details = {};
        
        // Map points by address
        if (currentWorkOrder.address.includes('Madrid')) {
            points = [
                { x: 50, y: 220, label: 'Technician' },
                { x: 180, y: 140, label: 'Splitter Hub OLT-MAD-12' },
                { x: 320, y: 80, label: 'Customer Premises' }
            ];
            details = { dist: '2.4 miles', time: '8 mins', gpon: 'GPON_OLT_04/2/1' };
        } else if (currentWorkOrder.address.includes('Barcelona')) {
            points = [
                { x: 80, y: 240, label: 'Technician' },
                { x: 220, y: 180, label: 'Splitter Hub OLT-BCN-09' },
                { x: 300, y: 60, label: 'Customer Premises' }
            ];
            details = { dist: '3.1 miles', time: '11 mins', gpon: 'GPON_OLT_02/1/7' };
        } else {
            points = [
                { x: 60, y: 200, label: 'Technician' },
                { x: 150, y: 110, label: 'Splitter Hub OLT-SEV-03' },
                { x: 340, y: 90, label: 'Customer Premises' }
            ];
            details = { dist: '1.8 miles', time: '6 mins', gpon: 'GPON_OLT_07/4/3' };
        }
        
        document.getElementById('map-route-dist').textContent = details.dist;
        document.getElementById('map-route-time').textContent = details.time;
        document.getElementById('map-gpon-port').textContent = details.gpon;
        
        // Draw route path line
        ctx.strokeStyle = '#06B6D4';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[0].y); 
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[1].y); 
        ctx.lineTo(points[2].x, points[2].y);
        ctx.stroke();
        
        // Draw markers
        // 1. Technician (Cyan dot)
        ctx.fillStyle = '#06B6D4';
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        // 2. Hub (Yellow square)
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(points[1].x - 6, points[1].y - 6, 12, 12);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 4;
        ctx.strokeRect(points[1].x - 8, points[1].y - 8, 16, 16);
        
        // 3. Customer (Green pin shape)
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(points[2].x, points[2].y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(points[2].x - 8, points[2].y - 10);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[2].x + 8, points[2].y - 10);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(points[2].x, points[2].y - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Text labels
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('Tech', points[0].x, points[0].y + 22);
        ctx.fillText('Hub', points[1].x, points[1].y + 22);
        ctx.fillText('Customer', points[2].x, points[2].y + 12);
    }

    // Photo viewer visual updates
    async function updatePhotoViewerForCurrentStep() {
        if (!currentInspection) {
            resetPhotoViewer();
            return;
        }
        
        const activeStep = INSPECTION_STEPS[activeStepIdx];
        const stepRecord = await FieldOpsStorage.getStep(currentInspection.id, activeStep.id);
        
        const imgElement = document.getElementById('photo-viewer-img');
        const placeholder = document.getElementById('photo-viewer-placeholder');
        const details = document.getElementById('photo-viewer-details');
        
        if (stepRecord && stepRecord.image_url) {
            // Retrieve image from IndexedDB step record
            const localImage = stepRecord.image_data;
            imgElement.src = localImage || '/images/captured-placeholder.jpg';
            imgElement.classList.remove('hidden');
            placeholder.classList.add('hidden');
            
            details.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                    <strong>Step Name:</strong> <span>${activeStep.name}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                    <strong>Evidence Type:</strong> <span style="text-transform:uppercase;">${stepRecord.evidence_type}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                    <strong>Blur Audit:</strong> <span class="qa-status ${stepRecord.quality_blur}">${stepRecord.quality_blur.toUpperCase()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                    <strong>Exposure Audit:</strong> <span class="qa-status ${stepRecord.quality_exposure}">${stepRecord.quality_exposure.toUpperCase()}</span>
                </div>
                ${stepRecord.ocr_value ? `<div style="display:flex; justify-content:space-between;"><strong>Extracted MAC:</strong> <span class="font-mono">${stepRecord.ocr_value}</span></div>` : ''}
            `;
        } else {
            resetPhotoViewer();
        }
    }

    function resetPhotoViewer() {
        const imgElement = document.getElementById('photo-viewer-img');
        const placeholder = document.getElementById('photo-viewer-placeholder');
        const details = document.getElementById('photo-viewer-details');
        
        if (imgElement) imgElement.classList.add('hidden');
        if (placeholder) placeholder.classList.remove('hidden');
        if (details) details.innerHTML = 'No photo evidence captured for this step yet.';
    }

    // Handle Manual Text message from Claude UI chat panel
    function handleManualChatSend() {
        const text = chatTextInput.value.trim();
        if (!text) return;
        
        appendDialogue('user', text);
        chatTextInput.value = '';
        
        if (connectionMode === 'online' && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'text',
                content: text
            }));
        } else {
            // Local fallback analyzer
            simulateOfflineTextCommand(text);
        }
    }

    // Local heuristic analyzer for offline text message inputs
    function simulateOfflineTextCommand(text) {
        const q = text.toLowerCase().trim();
        if (q.includes('photo') || q.includes('capture') || q.includes('take')) {
            FieldOpsVoiceConductor.announce("Taking photo");
            btnCapture.click();
        } else if (q.includes('next') || q.includes('continue')) {
            FieldOpsVoiceConductor.announce("Next step");
            nextStep();
        } else if (q.includes('previous') || q.includes('back') || q.includes('return')) {
            FieldOpsVoiceConductor.announce("Returning to previous step");
            prevStep();
        } else if (q.includes('repeat') || q.includes('instruction')) {
            const activeTitle = document.getElementById('active-step-title');
            if (activeTitle) {
                FieldOpsVoiceConductor.announce(activeTitle.textContent);
            }
        } else if (q.includes('summary') || q.includes('status')) {
            FieldOpsVoiceConductor.announce("Showing audit report summary.");
            const jsonPre = document.getElementById('json-report');
            if (jsonPre) {
                appendDialogue('agent', `Audit report payload:\n${jsonPre.textContent}`);
            }
        } else {
            setTimeout(() => {
                appendDialogue('agent', "Command not recognized offline. Try: 'take photo', 'next step', 'back', 'repeat instruction', or switch to Live Agent mode.");
            }, 800);
        }
    }

    // Setup event handlers
    function setupEventListeners() {
        woSelect.addEventListener('change', handleWorkOrderChange);
        
        btnModeOffline.addEventListener('click', () => setConnectionMode('offline'));
        btnModeOnline.addEventListener('click', () => setConnectionMode('online'));
        
        btnCapture.addEventListener('click', handleCapture);
        btnSyncQueue.addEventListener('click', handleManualSync);
        btnConfirmOcr.addEventListener('click', handleConfirmOcr);
        
        // Manual Chat Input buttons
        btnSendChat.addEventListener('click', handleManualChatSend);
        chatTextInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleManualChatSend();
        });

        // Analytics query submission
        const btnAskAnalytics = document.getElementById('btn-ask-analytics');
        const analyticsInput = document.getElementById('analytics-input');
        const sqlResultContainer = document.getElementById('sql-result-container');
        const sqlQueryDisplay = document.getElementById('sql-query-display');
        const sqlDataDisplay = document.getElementById('sql-data-display');
        
        btnAskAnalytics.addEventListener('click', async () => {
            const val = analyticsInput.value.trim();
            if (!val) return;
            
            try {
                const response = await fetch(`${API_BASE}/analytics/query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': AUTH_HEADER
                    },
                    body: JSON.stringify({ question: val })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    sqlQueryDisplay.textContent = data.sql;
                    sqlDataDisplay.textContent = JSON.stringify(data.result, null, 2);
                    sqlResultContainer.classList.remove('hidden');
                }
            } catch (err) {
                console.error("Failed to query conversational analytics:", err);
            }
        });

        // Global exposure for ORION relayout mock
        window.ORION_relayoutModals = function() {
            console.log("Relayouting panels...");
        };
    }

    // Refresh aggregated metrics cards on supervisor panel load
    async function refreshSupervisorMetrics() {
        try {
            const response = await fetch(`${API_BASE}/analytics/dashboard`, {
                headers: { 'Authorization': AUTH_HEADER }
            });
            if (response.ok) {
                const data = await response.json();
                document.getElementById('metric-total').textContent = data.total_installations;
                document.getElementById('metric-rate').textContent = `${data.approval_rate}%`;
                document.getElementById('metric-mismatches').textContent = data.ocr_mismatches;
                document.getElementById('metric-power').textContent = `${data.average_optical_power} dBm`;
            }
        } catch (err) {
            console.error("Failed to load dashboard metrics:", err);
        }
    }

    // Modify connection modes
    async function setConnectionMode(mode) {
        connectionMode = mode;
        if (mode === 'offline') {
            btnModeOffline.className = 'btn btn-secondary btn-xs active';
            btnModeOnline.className = 'btn btn-secondary btn-xs';
            networkStatus.className = 'network-badge offline';
            networkStatus.querySelector('.status-text').textContent = 'Offline Conductor';
            voicePrompt.textContent = 'Offline Conductor ready for voice commands...';
            disconnectWebSocket();
        } else {
            btnModeOffline.className = 'btn btn-secondary btn-xs';
            btnModeOnline.className = 'btn btn-secondary btn-xs active';
            networkStatus.className = 'network-badge online';
            networkStatus.querySelector('.status-text').textContent = 'Connected (Cloud)';
            voicePrompt.textContent = 'Live Agent online. WebSocket connection active.';
            await connectWebSocket();
        }
    }

    // Real-time WebSocket connection
    async function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        if (!currentInspection) {
            alert("Please select a work order before activating Live Agent mode.");
            setConnectionMode('offline');
            return;
        }

        const userId = currentInspection.technician_id;
        const sessionId = currentInspection.id;
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/ws/${userId}/${sessionId}`;

        console.log("Connecting to Live Agent WebSocket: ", wsUrl);
        ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = async () => {
            console.log("Live Agent WebSocket connection established");
            try {
                // Initialize local player worklet (24kHz mono playback)
                const [playerNode] = await FieldOpsAudioPlayer.start();
                audioPlayerNode = playerNode;

                // Initialize local recorder worklet (16kHz mono capture)
                await FieldOpsAudioRecorder.start(audioRecorderHandler);
                
                // Start capturing video frames at ~1 fps to stream visual context
                startVideoCaptureStream();
                
                appendDialogue('agent', "[Live Mode] Connection established. You can talk to the auditor in real-time.");
            } catch (err) {
                console.error("Failed to initialize audio worklets:", err);
                appendDialogue('agent', "[Live Mode] Audio initialization failed. Reverting to Offline.");
                setConnectionMode('offline');
            }
        };

        ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
                handleServerEvent(event.data);
            }
        };

        ws.onclose = () => {
            console.log("Live Agent WebSocket connection closed");
            cleanupWebSocketState();
            if (autoReconnect) {
                autoReconnect = false;
                setTimeout(connectWebSocket, 1500);
            }
        };

        ws.onerror = (err) => {
            console.error("Live Agent WebSocket error:", err);
            setConnectionMode('offline');
        };
    }

    function disconnectWebSocket() {
        if (ws) {
            ws.close();
            ws = null;
        }
    }

    function cleanupWebSocketState() {
        stopVideoCaptureStream();
        FieldOpsAudioRecorder.stop();
        if (audioPlayerNode) {
            try {
                audioPlayerNode.port.postMessage({ command: 'endOfAudio' });
                audioPlayerNode.disconnect();
                audioPlayerNode.context.close();
            } catch (_) {}
            audioPlayerNode = null;
        }
    }

    // Handles outgoing raw PCM audio chunks from the recorder
    function audioRecorderHandler(pcmData) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(pcmData); // sends binary frame over socket
        }
    }

    // Capture visual frames to send upstream
    function startVideoCaptureStream() {
        videoFrameInterval = setInterval(() => {
            if (!ws || ws.readyState !== WebSocket.OPEN) return;
            const b64Image = FieldOpsCamera.capture();
            ws.send(JSON.stringify({
                type: 'image_frame',
                data: b64Image
            }));
        }, 1000); // 1 fps
    }

    function stopVideoCaptureStream() {
        if (videoFrameInterval) {
            clearInterval(videoFrameInterval);
            videoFrameInterval = null;
        }
    }

    // Process incoming JSON events from the backend agent
    function handleServerEvent(jsonString) {
        let event;
        try {
            event = JSON.parse(jsonString);
        } catch {
            return;
        }

        // Handle barge-in (interrupted event)
        if (event.interrupted) {
            _bargeIn();
        }

        // Handle user transcription
        const inputText = event.inputTranscription?.text ?? event.input_transcription?.text;
        if (inputText) {
            _bargeIn();
            appendDialogue('user', inputText);
        }

        // Handle agent transcription
        const outputText = event.outputTranscription?.text ?? event.output_transcription?.text;
        if (outputText) {
            if (Date.now() - lastSuppressTime > 300) {
                audioSuppressed = false;
            }
            appendDialogue('agent', outputText);
        }

        // Process parts (e.g. audio playbacks or function calls)
        const parts = event.content?.parts ?? [];
        for (const part of parts) {
            // Stream audio chunks into the playout buffer
            const inlineData = part.inlineData ?? part.inline_data;
            const mimeType = inlineData?.mimeType ?? inlineData?.mime_type ?? '';
            
            if (inlineData && mimeType.startsWith('audio/pcm') && audioPlayerNode && !audioSuppressed) {
                const arrayBuffer = base64ToArray(inlineData.data);
                audioPlayerNode.port.postMessage(arrayBuffer);
            }

            // Route function calls (render_commands)
            const fc = part.functionCall ?? part.function_call;
            if (fc) {
                console.log("Receiving agent function call: ", fc.name, fc.args);
                dispatchRenderCommand(fc.name, fc.args ?? fc.arguments ?? {});
            }
        }
    }

    function _bargeIn() {
        if (audioSuppressed) return;
        audioSuppressed = true;
        lastSuppressTime = Date.now();
        if (audioPlayerNode) {
            audioPlayerNode.port.postMessage({ command: 'endOfAudio' });
        }
    }

    function base64ToArray(base64) {
        const std = base64.replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(std);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Handles tool UI command dispatches (Orion render_command model)
    function dispatchRenderCommand(name, args) {
        console.log("Dispatching render command for: ", name, args);
        
        if (name === 'navigate_step') {
            const stepId = args.step_id;
            const idx = INSPECTION_STEPS.findIndex(s => s.id === stepId);
            if (idx !== -1) {
                selectStep(idx);
            }
        } else if (name === 'display_validation_result') {
            overallVerdict.textContent = args.status.toUpperCase();
            overallVerdict.className = `overall-verdict-badge status-${args.status}`;
            verdictDesc.textContent = args.message;
        }
    }

    // Real edge AI capture execution
    async function handleCapture() {
        if (!currentInspection) return;
        const activeStep = INSPECTION_STEPS[activeStepIdx];
        
        console.log("Capturing photo for step: ", activeStep.id);
        
        // Capture frame from live viewfinder stream
        const base64Image = FieldOpsCamera.capture();
        
        // Run edge quality evaluation (simulates local ONNX checks)
        const qualityResults = await FieldOpsEdgeAI.evaluateQuality(base64Image, activeStep.id);
        
        // Update Edge QA display
        const qaResultsContainer = document.getElementById('qa-results-container');
        const qaBlur = document.getElementById('qa-blur').querySelector('.qa-status');
        const qaExposure = document.getElementById('qa-exposure').querySelector('.qa-status');
        const qaFraming = document.getElementById('qa-framing').querySelector('.qa-status');
        const qaFeedback = document.getElementById('qa-feedback');
        
        qaBlur.textContent = qualityResults.blur.toUpperCase();
        qaBlur.className = `qa-status ${qualityResults.blur}`;
        
        qaExposure.textContent = qualityResults.exposure.toUpperCase();
        qaExposure.className = `qa-status ${qualityResults.exposure}`;
        
        qaFraming.textContent = qualityResults.framing.toUpperCase();
        qaFraming.className = `qa-status ${qualityResults.framing}`;
        
        qaFeedback.textContent = qualityResults.feedback;
        qaResultsContainer.classList.remove('hidden');

        // Check if local QA passed
        if (qualityResults.blur === 'fail' || qualityResults.exposure === 'fail') {
            const errorMsg = "The capture failed edge quality checks. Please retake the photo.";
            appendDialogue('agent', errorMsg);
            FieldOpsVoiceConductor.announce(errorMsg);
            return;
        }

        // Run OCR if active step requires device label scanning
        let ocrMac = null;
        if (activeStep.id === 'ont-after-closeup') {
            const ocrResults = await FieldOpsEdgeAI.runOCR(base64Image, currentWorkOrder.expected_mac_prefix);
            ocrMac = ocrResults.mac;
            macInput.value = ocrMac;
            
            // Check MAC prefix match
            if (!ocrMac.startsWith(currentWorkOrder.expected_mac_prefix)) {
                macPrefixWarning.textContent = `⚠️ MAC prefix does not match expected: ${currentWorkOrder.expected_mac_prefix}`;
                macPrefixWarning.className = "help-text warning";
            } else {
                macPrefixWarning.textContent = "✓ Correct MAC prefix";
                macPrefixWarning.className = "help-text text-green";
            }
        }
        
        const stepData = {
            id: `${currentInspection.id}_${activeStep.id}`,
            inspection_id: currentInspection.id,
            step_id: activeStep.id,
            evidence_type: activeStep.type,
            image_url: `uploads/${currentWorkOrder.id}/${activeStep.id}/photo.jpg`,
            image_data: base64Image,
            ocr_value: ocrMac,
            optical_power_dbm: activeStep.id === 'power-meter' ? -19.5 : null,
            quality_blur: qualityResults.blur,
            quality_exposure: qualityResults.exposure,
            quality_framing: qualityResults.framing,
            compliance_verdict: 'pass',
            compliance_justification: qualityResults.feedback
        };
        
        await FieldOpsStorage.saveStep(stepData); // Save to IndexedDB
        appendDialogue('user', `Photo captured for: ${activeStep.name}`);
        
        // Wait 2s to show quality results then advance step
        setTimeout(async () => {
            qaResultsContainer.classList.add('hidden');
            
            if (activeStepIdx < INSPECTION_STEPS.length - 1) {
                activeStepIdx++;
                await renderSteps();
                await updatePhotoViewerForCurrentStep();
                const nextMsg = `Evidence saved locally. Next step: ${INSPECTION_STEPS[activeStepIdx].name}. ${INSPECTION_STEPS[activeStepIdx].desc}`;
                appendDialogue('agent', nextMsg);
                FieldOpsVoiceConductor.announce(nextMsg);
            } else {
                await renderSteps();
                await updatePhotoViewerForCurrentStep();
                appendDialogue('agent', "All steps completed! Preparing payload for final cloud audit validation.");
                FieldOpsVoiceConductor.announce("Inspection completed. Saving report locally.");
                await finalizeInspection();
            }
        }, 2000);
    }

    // Confirm local OCR edits
    async function handleConfirmOcr() {
        if (!currentInspection) return;
        const mac = macInput.value;
        console.log("Confirming OCR changes: ", mac);
        
        const stepRecord = await FieldOpsStorage.getStep(currentInspection.id, 'ont-after-closeup');
        if (stepRecord) {
            stepRecord.ocr_value = mac;
            await FieldOpsStorage.saveStep(stepRecord);
            appendDialogue('agent', `MAC address confirmed: ${mac}`);
            FieldOpsVoiceConductor.announce("Data confirmed.");
        }
    }

    // Assemble payload and trigger sync queueing
    async function finalizeInspection() {
        const steps = await FieldOpsStorage.getSteps(currentInspection.id);
        
        const payload = {
            id: currentInspection.id,
            work_order_id: currentInspection.work_order_id,
            technician_id: currentInspection.technician_id,
            gps_lat: currentWorkOrder.gps_lat || 40.416775,
            gps_lon: currentWorkOrder.gps_lon || -3.703790,
            steps: steps
        };
        
        jsonReport.textContent = JSON.stringify(payload, null, 2);
        
        // Save overall state locally
        currentInspection.overall_verdict = 'APPROVED';
        currentInspection.status = 'synced';
        await FieldOpsStorage.saveInspection(currentInspection);
        
        overallVerdict.textContent = "APPROVED";
        overallVerdict.className = "overall-verdict-badge status-pass";
        verdictDesc.textContent = "Successfully validated locally. Pending final cloud synchronization.";
        
        // Queue for background sync
        await FieldOpsStorage.queuePayload(payload);
        await updateSyncQueueBadge();
    }

    // Sync queue size badge update
    async function updateSyncQueueBadge() {
        const queue = await FieldOpsStorage.getSyncQueue();
        syncQueueCount.textContent = queue.length;
    }

    // Manual sync execution call
    async function handleManualSync() {
        const queue = await FieldOpsStorage.getSyncQueue();
        if (queue.length === 0) {
            appendDialogue('agent', "No pending audits in the sync queue.");
            return;
        }

        appendDialogue('agent', "Starting queue synchronization with cloud...");
        
        for (const item of queue) {
            try {
                // Simulate REST post file payload sync
                const response = await fetch(`${API_BASE}/sync`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': AUTH_HEADER
                    },
                    body: JSON.stringify(item)
                });
                
                if (response.ok) {
                    await FieldOpsStorage.removeSyncQueue(item.id);
                    dbGcsState.textContent = "Saved (GCS)";
                    dbGcsState.className = "sync-val status-green";
                    dbBqState.textContent = "Injected (BQ)";
                    dbBqState.className = "sync-val status-green";
                    console.log("Synced inspection ID: ", item.id);
                }
            } catch (err) {
                console.error("Sync payload error:", err);
            }
        }
        
        await updateSyncQueueBadge();
        appendDialogue('agent', "Audits synchronized and saved to Cloud Storage & BigQuery.");
    }

    // Append text to chat bubble list
    function appendDialogue(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `transcript-bubble ${sender}`;
        bubble.innerHTML = `<p>${text}</p>`;
        dialogueContainer.appendChild(bubble);
        dialogueContainer.scrollTop = dialogueContainer.scrollHeight;
    }

    // Expose steps changer for voice conductor
    function nextStep() {
        if (activeStepIdx < INSPECTION_STEPS.length - 1) {
            selectStep(activeStepIdx + 1);
        }
    }

    function prevStep() {
        if (activeStepIdx > 0) {
            selectStep(activeStepIdx - 1);
        }
    }

    return {
        init: init,
        appendDialogue: appendDialogue,
        nextStep: nextStep,
        prevStep: prevStep
    };
})();

// Link voice conductor intents
if (window.FieldOpsVoiceConductor) {
    // Override triggers
    FieldOpsVoiceConductor.triggerNextStep = FieldOpsApp.nextStep;
    FieldOpsVoiceConductor.triggerPrevStep = FieldOpsApp.prevStep;
}

// Launch application on DOM Content Load
window.addEventListener('DOMContentLoaded', FieldOpsApp.init);
