/* ==========================================================
   웹 명함 인터랙션 스크립트 - 오가을 (Autumn Oh)
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 선택
  const card = document.getElementById('card');
  const cardContainer = document.getElementById('cardContainer');
  const flipToBackBtn = document.getElementById('flipToBackBtn');
  const flipToFrontBtn = document.getElementById('flipToFrontBtn');
  const copyEmail = document.getElementById('copyEmail');
  const copyPhone = document.getElementById('copyPhone');
  const saveContactBtn = document.getElementById('saveContactBtn');
  const shareBtn = document.getElementById('shareBtn');
  const themeToggle = document.getElementById('themeToggle');
  const soundToggle = document.getElementById('soundToggle');
  const toast = document.getElementById('toast');
  const toastMessage = toast.querySelector('.toast-message');

  let isFlipped = false;
  let soundEnabled = false;
  let audioCtx = null;

  // 1. 토스트 알림 표시 함수
  function showToast(message, iconClass = 'fa-solid fa-circle-check') {
    toastMessage.textContent = message;
    const icon = toast.querySelector('i');
    icon.className = iconClass;
    toast.classList.add('show');

    playSoftChime();

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // 2. 부드러운 오디오 효과 (Web Audio API 합성 사운드)
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSoftChime(frequency = 520) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.log('Audio playback prevented', e);
    }
  }

  // 사운드 토글
  soundToggle.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    const icon = soundToggle.querySelector('i');
    if (soundEnabled) {
      icon.className = 'fa-solid fa-volume-high';
      showToast('사운드 효과가 켜졌습니다 🍃', 'fa-solid fa-volume-high');
      playSoftChime(660);
    } else {
      icon.className = 'fa-solid fa-volume-xmark';
      showToast('사운드 효과가 꺼졌습니다', 'fa-solid fa-volume-xmark');
    }
  });

  // 3. 카드 뒤집기 (앞면 <-> 뒷면)
  function toggleFlip(e) {
    if (e) e.stopPropagation();
    isFlipped = !isFlipped;
    card.classList.toggle('is-flipped', isFlipped);
    playSoftChime(isFlipped ? 440 : 580);
  }

  flipToBackBtn.addEventListener('click', toggleFlip);
  flipToFrontBtn.addEventListener('click', toggleFlip);

  // 4. 클립보드 복사 핸들러
  function handleCopy(text, label) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${label}이(가) 복사되었습니다! ✨`);
      }).catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`${label}이(가) 복사되었습니다! ✨`);
    } catch (err) {
      showToast('복사에 실패했습니다.', 'fa-solid fa-circle-exclamation');
    }
    document.body.removeChild(textArea);
  }

  copyEmail.addEventListener('click', () => {
    handleCopy(copyEmail.getAttribute('data-copy'), '이메일 주소');
  });

  copyPhone.addEventListener('click', () => {
    handleCopy(copyPhone.getAttribute('data-copy'), '전화번호');
  });

  // 5. vCard (.vcf) 생성 및 다운로드 (스마트폰에 원클릭 연락처 등록)
  saveContactBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:오가을',
      'N:오;가을;;;',
      'TITLE:자유로운 영혼',
      'TEL;TYPE=CELL:010-0201-6521',
      'EMAIL;TYPE=INTERNET:danjam@gmail.com',
      'NOTE:바람을 따라 생각을 짓고, 마음에 닿는 순간을 기록하는 자유로운 영혼',
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.setAttribute('download', '오가을_연락처.vcf');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    showToast('연락처 파일(vCard)이 다운로드되었습니다! 📇');
  });

  // 6. 명함 공유하기
  shareBtn.addEventListener('click', () => {
    const shareData = {
      title: '오가을 | 웹 명함',
      text: '자유로운 영혼, 오가을의 웹 명함입니다.',
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => { });
    } else {
      handleCopy(window.location.href, '명함 주소');
    }
  });

  // 7. 테마 전환 (라이트 모드 / 밤 모드)
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = themeToggle.querySelector('i');
    icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    showToast(isDark ? '신비로운 오로라 밤 모드 🌙' : '화사하고 싱그러운 낮 모드 ✨');
    playSoftChime(isDark ? 360 : 640);
  });

  // 8. 3D 마우스 호버 틸트 효과 (데스크톱)
  if (window.matchMedia('(pointer: fine)').matches) {
    cardContainer.addEventListener('mousemove', (e) => {
      if (isFlipped) return; // 뒤집힌 상태에서는 틸트 제한
      const rect = cardContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -9;
      const rotateY = ((x - centerX) / centerX) * 9;

      card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    cardContainer.addEventListener('mouseleave', () => {
      if (!isFlipped) {
        card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
      }
    });
  }

  // 9. 가을 감성 캔버스 배경 애니메이션 (단풍잎 & 빛망울)
  initAmbientCanvas();
});

// 단풍잎 & 부유 파티클 캔버스
function initAmbientCanvas() {
  const canvas = document.getElementById('ambient-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // 파티클 생성 (화사한 라벤더/핑크 꽃잎 & 반짝이는 별빛 파티클)
  const particles = [];
  const particleCount = 32;
  const colors = [
    'rgba(168, 85, 247, 0.45)', // 라벤더 퍼플
    'rgba(244, 114, 182, 0.45)', // 피치 핑크
    'rgba(192, 132, 252, 0.4)',  // 소프트 바이올렛
    'rgba(253, 224, 71, 0.45)',  // 햇살 골드 별빛
    'rgba(255, 255, 255, 0.65)'  // 펄 화이트
  ];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 8 + 3.5,
      speedX: Math.random() * 1.0 - 0.2,
      speedY: Math.random() * 0.8 + 0.35,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.025,
      color: colors[Math.floor(Math.random() * colors.length)],
      isPetal: Math.random() > 0.35
    });
  }

  function drawPetal(ctx, x, y, size, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    // 사랑스럽고 부드러운 꽃잎 형상
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.9, -size * 0.5, size * 0.8, size * 0.8, 0, size);
    ctx.bezierCurveTo(-size * 0.8, size * 0.8, -size * 0.9, -size * 0.5, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      // 화면 벗어나면 상단/좌측에서 재생성
      if (p.y > height + 20) {
        p.y = -20;
        p.x = Math.random() * width;
      }
      if (p.x > width + 20) {
        p.x = -20;
      }

      if (p.isPetal) {
        drawPetal(ctx, p.x, p.y, p.size, p.rotation, p.color);
      } else {
        // 반짝이는 빛망울
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    });

    requestAnimationFrame(animate);
  }

  animate();
}
