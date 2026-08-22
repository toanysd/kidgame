// StreetFighter WebRTC P2P Network Manager using PeerJS

export class NetworkManager {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.mediaCall = null;
        this.isHost = false;
        this.roomId = null;
        this.isConnected = false;
        this.remoteStream = null;
        this.localStream = null;
        
        this.remoteInputs = {
            left: false, right: false, up: false, down: false,
            lightPunch: false, mediumPunch: false, heavyPunch: false,
            lightKick: false, mediumKick: false, heavyKick: false
        };

        this.onStatusChange = null;
        this.onConnected = null;
        this.onDisconnected = null;
        this.onRemoteStream = null;
        this.onStateSync = null;
        this.onGameEvent = null;
        
        window.SF_NETWORK = this;
    }

    setStatus(text, isError = false) {
        console.log(`[NetworkManager] ${text}`);
        if (this.onStatusChange) {
            this.onStatusChange(text, isError);
        }
    }

    createRoom(localStream = null) {
        this.isHost = true;
        this.localStream = localStream;
        const shortCode = Math.floor(1000 + Math.random() * 9000).toString();
        const roomId = `SF-${shortCode}`;
        this.roomId = roomId;

        this.setStatus(`Đang khởi tạo phòng [${roomId}]...`);
        this.initPeer(roomId, () => {
            this.setStatus(`Phòng đã sẵn sàng! Mã: ${this.roomId}`);
        });

        return roomId;
    }

    joinRoom(roomId, localStream = null) {
        this.isHost = false;
        this.roomId = roomId.trim().toUpperCase();
        this.localStream = localStream;

        this.setStatus(`Đang kết nối tới phòng [${this.roomId}]...`);
        const randomId = `SF-GUEST-${Math.floor(1000 + Math.random() * 9000)}`;

        this.initPeer(randomId, () => {
            this.connectToHost(this.roomId);
        });
    }

    initPeer(peerId, onOpenCallback) {
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
        }

        if (typeof Peer === 'undefined') {
            this.setStatus('Lỗi: Thư viện PeerJS chưa được tải!', true);
            return;
        }

        this.peer = new Peer(peerId, {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            }
        });

        this.peer.on('open', (id) => {
            console.log('[PeerJS] Peer open with ID:', id);
            if (onOpenCallback) onOpenCallback(id);
        });

        this.peer.on('connection', (conn) => {
            console.log('[PeerJS] Incoming connection from:', conn.peer);
            this.setupConnection(conn);
        });

        this.peer.on('call', (call) => {
            console.log('[PeerJS] Incoming media call from:', call.peer);
            this.mediaCall = call;
            if (this.localStream) {
                call.answer(this.localStream);
            } else {
                call.answer();
            }
            call.on('stream', (stream) => {
                console.log('[PeerJS] Received remote media stream');
                this.remoteStream = stream;
                if (this.onRemoteStream) this.onRemoteStream(stream);
            });
        });

        this.peer.on('error', (err) => {
            console.error('[PeerJS] Error:', err);
            this.setStatus(`Lỗi kết nối: ${err.type || err.message}`, true);
        });

        this.peer.on('disconnected', () => {
            this.setStatus('Mất kết nối tới máy chủ PeerJS!', true);
        });
    }

    connectToHost(hostRoomId) {
        const conn = this.peer.connect(hostRoomId, {
            reliable: true
        });
        this.setupConnection(conn);

        // Call host with local camera stream if available
        if (this.localStream) {
            try {
                const call = this.peer.call(hostRoomId, this.localStream);
                this.mediaCall = call;
                call.on('stream', (stream) => {
                    this.remoteStream = stream;
                    if (this.onRemoteStream) this.onRemoteStream(stream);
                });
            } catch (e) {
                console.warn('[PeerJS] Media call error:', e);
            }
        }
    }

    setupConnection(conn) {
        this.conn = conn;

        conn.on('open', () => {
            console.log('[PeerJS] DataChannel Open with:', conn.peer);
            this.isConnected = true;
            this.setStatus(`Đã kết nối thành công với đối thủ!`);

            if (this.isHost && this.localStream) {
                try {
                    const call = this.peer.call(conn.peer, this.localStream);
                    this.mediaCall = call;
                    call.on('stream', (stream) => {
                        this.remoteStream = stream;
                        if (this.onRemoteStream) this.onRemoteStream(stream);
                    });
                } catch (e) {
                    console.warn('[PeerJS] Host media call error:', e);
                }
            }

            if (this.onConnected) {
                this.onConnected({
                    isHost: this.isHost,
                    peerId: conn.peer,
                    roomId: this.roomId
                });
            }
        });

        conn.on('data', (data) => {
            this.handleData(data);
        });

        conn.on('close', () => {
            console.log('[PeerJS] Connection closed');
            this.isConnected = false;
            this.setStatus('Đối thủ đã ngắt kết nối!', true);
            if (this.onDisconnected) this.onDisconnected();
        });

        conn.on('error', (err) => {
            console.error('[PeerJS] Connection error:', err);
            this.setStatus(`Lỗi DataChannel: ${err}`, true);
        });
    }

    handleData(data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case 'INPUT':
                if (data.inputs) {
                    this.remoteInputs = Object.assign(this.remoteInputs, data.inputs);
                    // Mirror remote inputs to global AI_OPPONENT_INPUT for P2 if Host, or AI_FRAME_INPUT for P1 if Guest
                    if (this.isHost) {
                        window.AI_OPPONENT_INPUT = Object.assign({}, this.remoteInputs);
                    } else {
                        window.AI_FRAME_INPUT = Object.assign({}, this.remoteInputs);
                    }
                }
                break;

            case 'SYNC':
                if (this.onStateSync && !this.isHost) {
                    this.onStateSync(data.state);
                }
                break;

            case 'EVENT':
                if (this.onGameEvent) {
                    this.onGameEvent(data.event);
                }
                break;
        }
    }

    sendInput(inputs) {
        if (!this.isConnected || !this.conn || !this.conn.open) return;
        this.conn.send({
            type: 'INPUT',
            inputs: inputs,
            time: performance.now()
        });
    }

    sendStateSync(state) {
        if (!this.isConnected || !this.conn || !this.conn.open || !this.isHost) return;
        this.conn.send({
            type: 'SYNC',
            state: state
        });
    }

    sendGameEvent(event) {
        if (!this.isConnected || !this.conn || !this.conn.open) return;
        this.conn.send({
            type: 'EVENT',
            event: event
        });
    }

    disconnect() {
        if (this.conn) {
            try { this.conn.close(); } catch (e) {}
            this.conn = null;
        }
        if (this.mediaCall) {
            try { this.mediaCall.close(); } catch (e) {}
            this.mediaCall = null;
        }
        if (this.peer) {
            try { this.peer.destroy(); } catch (e) {}
            this.peer = null;
        }
        this.isConnected = false;
        this.remoteStream = null;
    }
}

export const networkManager = new NetworkManager();
