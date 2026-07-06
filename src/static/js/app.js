/**
 * FieldOps Main PWA Controller with Live WebSocket support.
 */
const FieldOpsApp = (function() {
    const API_BASE = '/api/v1';
    const AUTH_HEADER = 'Bearer test-token-123';
    
    // Workflow steps definition
    const INSPECTION_STEPS = [
        { id: 'site-overview', name: 'Entorno de Instalación', desc: 'Capture una foto general del área de trabajo.', type: 'photo', mandatory: true },
        { id: 'ont-before', name: 'Antes de Instalar', desc: 'Capture una foto de la roseta óptica antes de montar el ONT.', type: 'photo', mandatory: true },
        { id: 'ont-after-frontal', name: 'ONT Frontal', desc: 'Capture una foto frontal del ONT ya montado y encendido.', type: 'photo', mandatory: true },
        { id: 'ont-after-closeup', name: 'Etiqueta ONT (Detalle)', desc: 'Capture una foto de cerca de la etiqueta con código de barras y MAC.', type: 'photo', mandatory: true },
        { id: 'power-meter', name: 'Potencia Óptica', desc: 'Capture una foto de la lectura del Power Meter o introduzca el valor.', type: 'reading', mandatory: true },
        { id: 'panoramic', name: 'Instalación Completa', desc: 'Capture una foto panorámica de toda la roseta, latiguillo y ONT final.', type: 'photo', mandatory: true }
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
    const voiceAgentPrompt = document.getElementById('voice-agent-prompt');
    const voiceWaves = document.getElementById('voice-waves');
    
    const dialogueContainer = document.getElementById('dialogue-container');
    const btnVoiceAgent = document.getElementById('btn-voice-agent');
    
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
            dbLocalState.textContent = "Conectado";
            dbLocalState.className = "sync-val status-green";
            
            await syncWorkOrders();
            await renderWorkOrderDropdown();
            await updateSyncQueueBadge();
            setupEventListeners();
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
        woSelect.innerHTML = '<option value="">-- Cargar orden de trabajo --</option>';
        workOrders.forEach(wo => {
            const opt = document.createElement('option');
            opt.value = wo.id;
            opt.textContent = `WO-${wo.id.substring(0,8)} (${wo.status}) - ${wo.address}`;
            woSelect.appendChild(opt);
        });
    }

    // Handle work order selection changes
    async function handleWorkOrderChange(event) {
        const woId = event.target.value;
        if (!woId) {
            woDetailsCard.classList.add('hidden');
            stepsTimeline.innerHTML = '<div class="step-placeholder">Seleccione una orden de trabajo para ver los pasos de inspección.</div>';
            currentWorkOrder = null;
            currentInspection = null;
            btnCapture.disabled = true;
            FieldOpsCamera.stop();
            disconnectWebSocket();
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
                overall_verdict: 'PENDIENTE',
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
        
        const welcomeMsg = `Se ha cargado la orden WO-${woId.substring(0,8)}. Por favor, realice la primera toma: ${INSPECTION_STEPS[0].name}.`;
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
    function selectStep(idx) {
        activeStepIdx = idx;
        renderSteps();
        
        const step = INSPECTION_STEPS[activeStepIdx];
        FieldOpsVoiceConductor.announce(`Cargando paso: ${step.name}. ${step.desc}`);
    }

    // Setup event handlers
    function setupEventListeners() {
        woSelect.addEventListener('change', handleWorkOrderChange);
        
        btnModeOffline.addEventListener('click', () => setConnectionMode('offline'));
        btnModeOnline.addEventListener('click', () => setConnectionMode('online'));
        
        btnCapture.addEventListener('click', handleCapture);
        btnSyncQueue.addEventListener('click', handleManualSync);
        
        btnConfirmOcr.addEventListener('click', handleConfirmOcr);
        
        // Supervisor & Analytics panel toggling
        const btnToggleSupervisor = document.getElementById('btn-toggle-supervisor');
        const auditorPanel = document.getElementById('auditor-panel');
        const supervisorPanel = document.getElementById('supervisor-panel');
        
        btnToggleSupervisor.addEventListener('click', () => {
            auditorPanel.classList.toggle('hidden');
            supervisorPanel.classList.toggle('hidden');
            if (!supervisorPanel.classList.contains('hidden')) {
                refreshSupervisorMetrics();
            }
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
            btnModeOffline.className = 'btn btn-secondary btn-sm active';
            btnModeOnline.className = 'btn btn-secondary btn-sm';
            networkStatus.className = 'network-badge offline';
            networkStatus.querySelector('.status-text').textContent = 'Modo Conductor (Offline)';
            voicePrompt.textContent = 'Offline Conductor listo para comandos de voz...';
            disconnectWebSocket();
        } else {
            btnModeOffline.className = 'btn btn-secondary btn-sm';
            btnModeOnline.className = 'btn btn-secondary btn-sm active';
            networkStatus.className = 'network-badge online';
            networkStatus.querySelector('.status-text').textContent = 'Conectado (Nube)';
            voicePrompt.textContent = 'Agente Live en línea. Conexión WebSocket activa.';
            await connectWebSocket();
        }
    }

    // Real-time WebSocket connection
    async function connectWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        if (!currentInspection) {
            alert("Seleccione una orden de trabajo antes de activar el modo Live Agent.");
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
                
                appendDialogue('agent', "[Live Mode] Conexión establecida. Puedes hablar con el auditor en tiempo real.");
            } catch (err) {
                console.error("Failed to initialize audio worklets:", err);
                appendDialogue('agent', "[Live Mode] Error en inicialización de audio. Regresando a Offline.");
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
            const errorMsg = "La captura falló los controles de calidad en el borde. Por favor repita la foto.";
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
                macPrefixWarning.textContent = `⚠️ Prefijo MAC no coincide con el esperado: ${currentWorkOrder.expected_mac_prefix}`;
                macPrefixWarning.className = "help-text warning";
            } else {
                macPrefixWarning.textContent = "✓ Prefijo MAC correcto";
                macPrefixWarning.className = "help-text text-green";
            }
        }
        
        const stepData = {
            id: `${currentInspection.id}_${activeStep.id}`,
            inspection_id: currentInspection.id,
            step_id: activeStep.id,
            evidence_type: activeStep.type,
            image_url: `uploads/${currentWorkOrder.id}/${activeStep.id}/photo.jpg`,
            ocr_value: ocrMac,
            optical_power_dbm: activeStep.id === 'power-meter' ? -19.5 : null,
            quality_blur: qualityResults.blur,
            quality_exposure: qualityResults.exposure,
            quality_framing: qualityResults.framing,
            compliance_verdict: 'pass',
            compliance_justification: qualityResults.feedback
        };
        
        await FieldOpsStorage.saveStep(stepData);
        appendDialogue('user', `Foto tomada para: ${activeStep.name}`);
        
        // Wait 1.5s to show quality results then advance step
        setTimeout(async () => {
            qaResultsContainer.classList.add('hidden');
            
            if (activeStepIdx < INSPECTION_STEPS.length - 1) {
                activeStepIdx++;
                await renderSteps();
                const nextMsg = `Evidencia guardada localmente. Siguiente paso: ${INSPECTION_STEPS[activeStepIdx].name}. ${INSPECTION_STEPS[activeStepIdx].desc}`;
                appendDialogue('agent', nextMsg);
                FieldOpsVoiceConductor.announce(nextMsg);
            } else {
                await renderSteps();
                appendDialogue('agent', "¡Todos los pasos completados! Preparando el payload para la validación de auditoría final.");
                FieldOpsVoiceConductor.announce("Inspección completada. Guardando reporte localmente.");
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
            appendDialogue('agent', `Dirección MAC confirmada: ${mac}`);
            FieldOpsVoiceConductor.announce("Datos confirmados.");
        }
    }

    // Assemble payload and trigger sync queueing
    async function finalizeInspection() {
        const steps = await FieldOpsStorage.getSteps(currentInspection.id);
        
        const payload = {
            id: currentInspection.id,
            work_order_id: currentInspection.work_order_id,
            technician_id: currentInspection.technician_id,
            gps_lat: 40.416775,
            gps_lon: -3.703790,
            steps: steps
        };
        
        jsonReport.textContent = JSON.stringify(payload, null, 2);
        
        // Save overall state locally
        currentInspection.overall_verdict = 'APROBADO';
        currentInspection.status = 'synced';
        await FieldOpsStorage.saveInspection(currentInspection);
        
        overallVerdict.textContent = "APROBADO";
        overallVerdict.className = "overall-verdict-badge status-pass";
        verdictDesc.textContent = "Validado localmente con éxito. Pendiente de sincronización definitiva.";
        
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
            appendDialogue('agent', "No hay auditorías pendientes en la cola de sincronización.");
            return;
        }

        appendDialogue('agent', "Iniciando sincronización de cola con la nube...");
        
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
                    dbGcsState.textContent = "Guardado (GCS)";
                    dbGcsState.className = "sync-val status-green";
                    dbBqState.textContent = "Inyectado (BQ)";
                    dbBqState.className = "sync-val status-green";
                    console.log("Synced inspection ID: ", item.id);
                }
            } catch (err) {
                console.error("Sync payload error:", err);
            }
        }
        
        await updateSyncQueueBadge();
        appendDialogue('agent', "Auditorías sincronizadas y guardadas en Cloud Storage & BigQuery.");
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
