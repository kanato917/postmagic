document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();

  // ----- Form handling -----
  const postForm = document.getElementById('postForm');
  
  postForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Simulate a submission process
    const submitBtn = postForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> 処理中...';
    lucide.createIcons();
    submitBtn.disabled = true;

    // Simulate API call to Make/Notion
    setTimeout(() => {
      alert("下書きリクエストを送信しました！\n（※システム側の処理が完了するとNotionに反映されます）");
      submitBtn.innerHTML = originalText;
      lucide.createIcons();
      submitBtn.disabled = false;
      postForm.reset();
      updatePreview();
    }, 1500);
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
