// Helper to map normalized coordinates to canvas coordinates
function mapPt(pt, layout) {
    return {
        x: pt.x * layout.drawW + layout.drawX,
        y: pt.y * layout.drawH + layout.drawY
    };
}

const plugins = [
    {
        name: "🌸 Beauty: Má Hồng",
        desc: "Làm đẹp cho Nữ - Filter má hồng & son môi",
        render: (ctx, results, layout) => {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
            const landmarks = results.multiFaceLandmarks[0];

            ctx.save();
            
            // 1. Lớp nền làm trắng & mịn da (Foundation / Whitening)
            const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
            ctx.beginPath();
            faceOval.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            
            // Dùng soft-light để làm sáng da tự nhiên mà không mất chi tiết
            ctx.globalCompositeOperation = 'soft-light';
            ctx.fillStyle = 'rgba(255, 230, 240, 0.4)'; // Hồng phấn nhẹ nhàng
            if (typeof ctx.filter !== 'undefined') {
                ctx.filter = 'blur(4px)'; // Làm mịn (nếu trình duyệt hỗ trợ)
            }
            ctx.fill();
            ctx.filter = 'none';

            // 2. Má hồng tự nhiên (Natural Blush)
            ctx.globalCompositeOperation = 'multiply';
            ctx.globalAlpha = 0.25; // Rất nhẹ nhàng
            
            // Má trái (Right cheek on flipped image)
            const leftCheek = mapPt(landmarks[205], layout); // approximate
            // Má phải (Left cheek on flipped image)
            const rightCheek = mapPt(landmarks[425], layout);
            
            // Bán kính to hơn để tỏa đều
            const blushRadius = layout.drawW * 0.12; 
            
            const drawBlush = (pt) => {
                const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, blushRadius);
                grad.addColorStop(0, '#ff7eb3');
                grad.addColorStop(0.5, 'rgba(255, 126, 179, 0.5)');
                grad.addColorStop(1, 'rgba(255, 126, 179, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath(); ctx.arc(pt.x, pt.y, blushRadius, 0, Math.PI*2); ctx.fill();
            };
            drawBlush(leftCheek);
            drawBlush(rightCheek);

            // 3. Son môi trong trẻo (Lip tint)
            // Dùng soft-light/multiply để giữ nguyên vân môi
            ctx.globalCompositeOperation = 'soft-light';
            ctx.globalAlpha = 0.6; // Đậm hơn một chút nhưng dùng soft-light nên sẽ tệp vào da
            ctx.fillStyle = '#ff1493'; // Màu son thật rực (sẽ dịu đi nhờ soft-light)
            
            const upperLipOuter = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
            const upperLipInner = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308].reverse();
            
            ctx.beginPath();
            upperLipOuter.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            upperLipInner.forEach((id) => {
                let pt = mapPt(landmarks[id], layout);
                ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            if (typeof ctx.filter !== 'undefined') ctx.filter = 'blur(1px)'; // Làm viền môi mềm mại
            ctx.fill();

            const lowerLipOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
            const lowerLipInner = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308].reverse();
            
            ctx.beginPath();
            lowerLipOuter.forEach((id, i) => {
                let pt = mapPt(landmarks[id], layout);
                if(i===0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
            });
            lowerLipInner.forEach((id) => {
                let pt = mapPt(landmarks[id], layout);
                ctx.lineTo(pt.x, pt.y);
            });
            ctx.closePath();
            ctx.fill();

            ctx.restore(); // Khôi phục lại trạng thái blend mode, alpha, filter
        }
    },
    {
        name: "🍩 Kids: Ăn Bánh Donut",
        desc: "Há miệng thật to để ăn bánh!",
        state: { donuts: [], score: 0 },
        onActivate: function() {
            this.state.score = 0;
            this.state.donuts = [];
            // Spawn donuts periodically
            this.interval = setInterval(() => {
                this.state.donuts.push({
                    x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
                    y: -50,
                    vy: 3 + Math.random() * 3
                });
            }, 1500);
        },
        onDeactivate: function() {
            clearInterval(this.interval);
        },
        render: function(ctx, results, layout) {
            // Draw Score (un-flip text)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.font = "bold 40px 'Be Vietnam Pro'";
            ctx.fillStyle = "#facc15";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 4;
            // Draw at -x since canvas is flipped
            ctx.strokeText(`Điểm: ${this.state.score}`, -layout.WIDTH + 20, 60);
            ctx.fillText(`Điểm: ${this.state.score}`, -layout.WIDTH + 20, 60);
            ctx.restore();

            let mouthOpen = false;
            let mouthCenter = {x: 0, y: 0};
            
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                const upperLip = mapPt(landmarks[13], layout);
                const lowerLip = mapPt(landmarks[14], layout);
                
                const distance = Math.abs(upperLip.y - lowerLip.y);
                mouthOpen = distance > 20; // threshold
                mouthCenter = { x: (upperLip.x + lowerLip.x)/2, y: (upperLip.y + lowerLip.y)/2 };
            }

            // Update and draw donuts
            for (let i = this.state.donuts.length - 1; i >= 0; i--) {
                let d = this.state.donuts[i];
                d.y += d.vy;
                
                // Draw donut
                ctx.font = "50px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("🍩", d.x, d.y);
                
                // Check collision
                if (mouthOpen && Math.abs(d.x - mouthCenter.x) < 50 && Math.abs(d.y - mouthCenter.y) < 50) {
                    this.state.score += 10;
                    this.state.donuts.splice(i, 1);
                    // play sound or particles here
                } else if (d.y > layout.HEIGHT + 50) {
                    this.state.donuts.splice(i, 1);
                }
            }
        }
    }
];

window.registerPlugins(plugins);
