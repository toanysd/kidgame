const pinInput = document.getElementById('pinInput');
const addBtn = document.getElementById('addBtn');
const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');

// Initialize Peer for the Monitor (it doesn't need a specific ID)
const peer = new Peer();

peer.on('open', (id) => {
    console.log('Monitor ready with ID:', id);
});

peer.on('error', (err) => {
    console.error(err);
    statusEl.innerText = `Lỗi: ${err.type} - Vui lòng kiểm tra lại mã PIN.`;
});

addBtn.addEventListener('click', () => {
    const pin = pinInput.value.trim();
    if (pin.length !== 4) {
        statusEl.innerText = "Vui lòng nhập mã PIN gồm 4 chữ số.";
        return;
    }

    const targetId = `kidgame-${pin}`;
    statusEl.innerText = `Đang kết nối tới Thiết bị: ${pin}...`;

    // Initiate call
    const call = peer.call(targetId, null); // We don't send our own stream
    
    if (!call) {
        statusEl.innerText = `Không thể gọi tới PIN ${pin}.`;
        return;
    }

    call.on('stream', (remoteStream) => {
        statusEl.innerText = `Đã kết nối thành công tới ${pin}!`;
        addVideoCard(pin, remoteStream, call);
        pinInput.value = ''; // clear input
    });

    call.on('close', () => {
        statusEl.innerText = `Kết nối tới ${pin} đã đóng.`;
    });
});

function addVideoCard(pin, stream, callObj) {
    // Check if card already exists
    if (document.getElementById(`card-${pin}`)) return;

    const card = document.createElement('div');
    card.className = 'camera-card';
    card.id = `card-${pin}`;

    const header = document.createElement('div');
    header.className = 'camera-header';
    header.innerHTML = `<span>📱 Thiết bị PIN: ${pin}</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerText = '❌';

    let snapIntervalId = null;
    let mediaRecorder = null;

    closeBtn.onclick = () => {
        if (snapIntervalId) clearInterval(snapIntervalId);
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        callObj.close();
        card.remove();
    };
    header.appendChild(closeBtn);

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;

    // --- Controls Container ---
    const controls = document.createElement('div');
    controls.className = 'camera-controls';

    // 1. Record Button
    const recordBtn = document.createElement('button');
    recordBtn.className = 'btn-small btn-record';
    recordBtn.innerText = '🔴 Ghi hình';
    
    let recordedChunks = [];
    
    recordBtn.onclick = () => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            recordedChunks = [];
            // Use WebM format for broader browser support
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            
            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `KidGame_Record_${pin}_${new Date().getTime()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
            };
            
            mediaRecorder.start();
            recordBtn.innerText = '⏹ Dừng ghi';
            recordBtn.classList.add('recording');
        } else {
            mediaRecorder.stop();
            recordBtn.innerText = '🔴 Ghi hình';
            recordBtn.classList.remove('recording');
        }
    };

    // 2. Auto Screenshot Select
    const snapWrap = document.createElement('div');
    snapWrap.style.display = 'flex';
    snapWrap.style.alignItems = 'center';
    snapWrap.style.gap = '10px';
    
    const snapSelect = document.createElement('select');
    snapSelect.className = 'interval-select';
    snapSelect.innerHTML = `
        <option value="0">Tắt chụp ảnh</option>
        <option value="120000">Tự động: 2 Phút</option>
        <option value="180000">Tự động: 3 Phút</option>
        <option value="300000">Tự động: 5 Phút</option>
    `;

    const manualSnapBtn = document.createElement('button');
    manualSnapBtn.className = 'btn-small btn-shot';
    manualSnapBtn.innerText = '📸 Chụp ngay';

    const takeScreenshot = () => {
        const canvas = document.createElement('canvas');
        // Fallback size if video metadata isn't fully loaded
        canvas.width = video.videoWidth || 800;
        canvas.height = video.videoHeight || 600;
        
        if (canvas.width > 0 && canvas.height > 0) {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `KidGame_Snap_${pin}_${new Date().getTime()}.png`;
            a.click();
        }
    };

    manualSnapBtn.onclick = takeScreenshot;

    snapSelect.onchange = () => {
        if (snapIntervalId) clearInterval(snapIntervalId);
        const val = parseInt(snapSelect.value);
        if (val > 0) {
            snapIntervalId = setInterval(takeScreenshot, val);
            statusEl.innerText = `Đã bật tự động chụp ảnh (${val/60000} phút/lần) cho thiết bị ${pin}.`;
        } else {
            statusEl.innerText = `Đã tắt chụp ảnh tự động thiết bị ${pin}.`;
        }
    };

    snapWrap.appendChild(snapSelect);
    snapWrap.appendChild(manualSnapBtn);

    controls.appendChild(recordBtn);
    controls.appendChild(snapWrap);

    card.appendChild(header);
    card.appendChild(video);
    card.appendChild(controls);
    grid.appendChild(card);
}
