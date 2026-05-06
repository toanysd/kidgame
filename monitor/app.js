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
    closeBtn.onclick = () => {
        callObj.close();
        card.remove();
    };
    header.appendChild(closeBtn);

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    // Mute to avoid echo/feedback loop if near the device
    video.muted = true;
    video.srcObject = stream;

    card.appendChild(header);
    card.appendChild(video);
    grid.appendChild(card);
}
