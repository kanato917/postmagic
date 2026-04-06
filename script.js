document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // ----- Form handling -----
  const postForm = document.getElementById('postForm');

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ① 空送信バリデーション
    // 文章・画像・URL のうち少なくとも1つに値があるか確認する
    const textVal = document.getElementById('sourceText').value.trim();
    const urlVal  = document.getElementById('sourceUrl').value.trim();
    const imageInput = document.getElementById('sourceImage');
    const imageFile  = imageInput.files[0];

    if (!textVal && !urlVal && !imageFile) {
      alert('内容を入力してください（文章・画像・URLのいずれか1つ以上が必要です）');
      return;
    }

    const submitBtn = postForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> 送信中...';
    lucide.createIcons();
    submitBtn.disabled = true;

    // ② 画像処理：画像がある場合は圧縮してから Base64 変換
    //    Canvas APIでリサイズ（最大1920px）＆JPEG変換 → 5MB制限内に収める
    let base64Image    = null;
    let finalMimeType  = null;

    if (imageFile) {
      const compressedBlob = await compressImage(imageFile);
      base64Image   = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(compressedBlob);
      });
      finalMimeType = 'image/jpeg'; // 圧縮後は常にJPEG
    }

    // ③ ペイロード：値の有無に関わらず常に同じキー構造で送信
    const payload = {
      sns:              Array.from(postForm.querySelectorAll('input[name="sns"]:checked')).map(cb => cb.value),
      sourceText:       textVal  || "",
      sourceUrl:        urlVal   || "",
      purpose:          document.getElementById('purpose').value          || "",
      tone:             document.getElementById('tone').value             || "",
      hashtag:          document.getElementById('hashtag').checked,
      withImage:        document.getElementById('withImage').checked,
      memo:             document.getElementById('memo').value             || "",
      scheduleDatetime: document.getElementById('scheduleDatetime').value || "",
      imageBuffer:      base64Image,                                  // 画像なし → null
      imageName:        imageFile ? imageFile.name : null,              // 画像なし → null
      imageMimeType:    finalMimeType,                                  // 圧縮後は常に image/jpeg
      timestamp:        new Date().toISOString()
    };

    try {
      // Make.com Webhook URL
      const WEBHOOK_URL = 'https://hook.eu1.make.com/xdrqbno2q72vqyj39owolec54b9m8yhe';

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('送信成功！Notionにデータを送りました。');
        postForm.reset();
        updatePreview();
      } else {
        throw new Error(`送信エラー: ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('送信に失敗しました。ネットワーク接続をご確認ください。');
    } finally {
      submitBtn.innerHTML = originalText;
      lucide.createIcons();
      submitBtn.disabled = false;
    }
  });

  // ----- Tab Switching in Preview -----
  const tabBtns = document.querySelectorAll('.tab-btn');
  const mockupViews = document.querySelectorAll('.mockup-view');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all tabs
      tabBtns.forEach(t => t.classList.remove('active'));
      // Add active to clicked tab
      btn.classList.add('active');

      // Hide all mockups
      mockupViews.forEach(m => m.classList.remove('active'));

      // Show target mockup
      const targetId = btn.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // ----- Live Preview Logic -----
  const sourceText = document.getElementById('sourceText');
  const sourceImage = document.getElementById('sourceImage');
  const sourceUrl = document.getElementById('sourceUrl');
  const previewTextX = document.getElementById('previewTextX');
  const previewTextIg = document.getElementById('previewTextIg');
  const withImageCheckbox = document.getElementById('withImage');
  const xPlaceholder = document.querySelector('.x-placeholder');
  const igPlaceholder = document.querySelector('.ig-placeholder');
  const fileLabelMain = document.querySelector('.file-label-main');
  const fileUploadArea = document.querySelector('.file-upload-area');

  // Handle file selection
  sourceImage.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const count = e.target.files.length;
      fileLabelMain.textContent = `${count}個の画像を選択中`;
      fileUploadArea.classList.add('has-file');
      withImageCheckbox.checked = true; // Auto check image generation/attachment
      updatePreview();
    } else {
      fileLabelMain.textContent = "画像を選択";
      fileUploadArea.classList.remove('has-file');
      updatePreview();
    }
  });

  function updatePreview() {
    const text = sourceText.value.trim();
    const url = sourceUrl.value.trim();

    let combinedText = text;
    if (url) {
      combinedText += (combinedText ? '\n\n' : '') + `参考URL: ${url}`;
    }

    if (combinedText === '') {
      previewTextX.innerHTML = "ここに自動生成されたX向けの短くキャッチーなテキストが入ります。<br><br>#ハッシュタグ #サンプル";
      previewTextIg.innerHTML = "<strong>your_account</strong> ここにInstagram向けの少し長めで詳細なテキストと、複数のハッシュタグが入る想定です。<br><br>#インスタ #ハッシュタグ #サンプル";
    } else {
      const truncatedX = combinedText.length > 100 ? combinedText.substring(0, 100) + '...' : combinedText;
      previewTextX.textContent = truncatedX + '\n\n#自動化 #SaaS';

      previewTextIg.innerHTML = `<strong>your_account</strong> ${combinedText}\n\n👇詳細はこちら\n#自動投稿 #便利ツール #SaaS`;
    }

    // Toggle image placeholders
    const hasImageFile = sourceImage.files && sourceImage.files.length > 0;
    if (withImageCheckbox.checked || hasImageFile) {
      xPlaceholder.style.display = 'flex';
      igPlaceholder.style.display = 'flex';
      if (hasImageFile) {
        igPlaceholder.innerHTML = '<i data-lucide="image"></i><span>アップロード画像を使用</span>';
        xPlaceholder.innerHTML = '<i data-lucide="image"></i><span>アップロード画像を使用</span>';
      } else {
        igPlaceholder.innerHTML = '<i data-lucide="image"></i><span>自動生成画像<br>（Instagram用は画像が必須になります）</span>';
        xPlaceholder.innerHTML = '<i data-lucide="image"></i><span>自動生成画像</span>';
      }
    } else {
      xPlaceholder.style.display = 'none';
      igPlaceholder.style.display = 'flex';
      igPlaceholder.innerHTML = '<i data-lucide="image"></i><span>自動生成画像<br>（Instagram用は画像が必須になります）</span>';
    }
    lucide.createIcons();
  }

  // Set default state based on today's date
  const datetimeInput = document.getElementById('scheduleDatetime');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  datetimeInput.value = now.toISOString().slice(0, 16);

  // Event Listeners for Live Preview
  sourceText.addEventListener('input', updatePreview);
  sourceUrl.addEventListener('input', updatePreview);
  withImageCheckbox.addEventListener('change', updatePreview);
});


// ----- 画像圧縮ユーティリティ -----
// Canvas API を使って画像をリサイズ＆JPEG変換し、Webhookの5MB制限に収める
// maxWidth/maxHeight: 最大辺のピクセル数（デフォルト1920px）
// quality: JPEG品質 0〜1（デフォルト0.85 = 85%）
async function compressImage(file, maxWidth = 1920, maxHeight = 1920, quality = 0.85) {
  return new Promise((resolve) => {
    const img    = new Image();
    const objUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objUrl);

      let { width, height } = img;

      // アスペクト比を維持しながら最大サイズ内に収める
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      // JPEG形式で圧縮して Blob に変換
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    };

    img.src = objUrl;
  });
}

// Extra css for spinner
const style = document.createElement('style');
style.innerHTML = `
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
