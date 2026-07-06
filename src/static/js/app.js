/**
 * FieldOps Main PWA Controller.
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
        
        appendDialogue('agent', `Se ha cargado la orden WO-${woId.substring(0,8)}. Por favor, realice la primera toma: ${INSPECTIONSTEPS()[0].name}.`);
    }

    // Helper returning steps schema list
    function INSPECTIONSTEPS() {
        return INSPECTION_STEPS;
    }

    // Render Steps list
    async function renderSteps() {
        if (!currentInspection) return;
        
        const stepsData = await FieldOpsStorage.getSteps(currentInspection.id);
        stepsTimeline.innerHTML = '';
        
        INSPECTIONSTEPS().forEach((step, idx) => {
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
        const activeStep = INSPECTIONSTEPS()[activeStepIdx];
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
    }

    // Setup event handlers
    function setupEventListeners() {
        woSelect.addEventListener('change', handleWorkOrderChange);
        
        btnModeOffline.addEventListener('click', () => setConnectionMode('offline'));
        btnModeOnline.addEventListener('click', () => setConnectionMode('online'));
        
        btnCapture.addEventListener('click', handleCapture);
        btnSyncQueue.addEventListener('click', handleManualSync);
        
        // Global exposure for ORION relayout mock
        window.ORION_relayoutModals = function() {
            console.log("Relayouting panels...");
        };
    }

    // Modify connection modes
    function setConnectionMode(mode) {
        connectionMode = mode;
        if (mode === 'offline') {
            btnModeOffline.classList.add('active');
            btnModeOnline.classList.remove('active');
            networkStatus.className = 'network-badge offline';
            networkStatus.querySelector('.status-text').textContent = 'Modo Conductor (Offline)';
            voiceAgentPrompt.textContent = 'Offline Conductor listo para comandos de voz...';
        } else {
            btnModeOffline.classList.remove('active');
            btnModeOnline.classList.add('active');
            networkStatus.className = 'network-badge online';
            networkStatus.querySelector('.status-text').textContent = 'Conectado (Nube)';
            voiceAgentPrompt.textContent = 'Agente Live en línea. Conexión WebSocket activa.';
        }
    }

    // Mock capture action
    async function handleCapture() {
        if (!currentInspection) return;
        const activeStep = INSPECTIONSTEPS()[activeStepIdx];
        
        console.log("Capturing photo for step: ", activeStep.id);
        
        // Simulate local AI calculations
        const mockStepData = {
            id: `${currentInspection.id}_${activeStep.id}`,
            inspection_id: currentInspection.id,
            step_id: activeStep.id,
            evidence_type: activeStep.type,
            image_url: `uploads/${currentWorkOrder.id}/${activeStep.id}/photo.jpg`,
            ocr_value: activeStep.id === 'ont-after-closeup' ? `${currentWorkOrder.expected_mac_prefix}:AA:BB:CC` : null,
            optical_power_dbm: activeStep.id === 'power-meter' ? -19.5 : null,
            quality_blur: 'pass',
            quality_exposure: 'pass',
            quality_framing: 'pass',
            compliance_verdict: 'pass',
            compliance_justification: 'Foto de calidad correcta conforme a la norma de planta externa.'
        };
        
        await FieldOpsStorage.saveStep(mockStepData);
        appendDialogue('user', `Foto tomada para ${activeStep.name}`);
        
        // Advance step
        if (activeStepIdx < INSPECTIONSTEPS().length - 1) {
            activeStepIdx++;
            await renderSteps();
            appendDialogue('agent', `Evidencia guardada localmente. Proceda al paso: ${INSPECTIONSTEPS()[activeStepIdx].name}.`);
        } else {
            await renderSteps();
            appendDialogue('agent', "¡Todos los pasos completados! Preparando el payload para la validación de auditoría final.");
            await finalizeInspection();
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

    return {
        init: init
    };
})();

// Launch application on DOM Content Load
window.addEventListener('DOMContentLoaded', FieldOpsApp.init);
