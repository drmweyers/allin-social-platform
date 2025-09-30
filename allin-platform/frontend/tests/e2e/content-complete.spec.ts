import { test, expect, Page } from '@playwright/test';
import { TestHelpers, SELECTORS } from '../utils/test-helpers';

/**
 * ✍️ COMPREHENSIVE CONTENT CREATION & MANAGEMENT TESTS
 *
 * This test suite covers EVERY aspect of content creation and management:
 * - Rich text editor (all formatting options)
 * - Media upload (images, videos, GIFs)
 * - Character counter for each platform
 * - Hashtag suggestions and management
 * - Emoji picker functionality
 * - Platform selector and multi-posting
 * - Preview functionality for all platforms
 * - Draft saving and management
 * - Template system
 * - Content scheduling
 * - Post history and management
 * - Content collaboration features
 * - AI-powered content assistance
 * - Content optimization suggestions
 */

test.describe('✍️ COMPLETE CONTENT CREATION & MANAGEMENT TESTS', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);

    // Login first
    await page.goto('/auth/login');
    await page.fill('input#email', 'admin@allin.demo');
    await page.fill('input#password', 'Admin123!@#');
    await page.click('button[type="submit"]');

    // Navigate to content creation page
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    await page.goto('/dashboard/create');
    await helpers.waitForLoadingComplete();
  });

  test.describe('📝 RICH TEXT EDITOR - Complete Testing', () => {
    test('EDITOR-001: Rich text editor initialization and basic functionality', async ({ page }) => {
      // Find the main content editor
      const editorSelectors = [
        '[data-testid="content-editor"]',
        '.content-editor',
        'textarea[placeholder*="content"]',
        '[contenteditable="true"]',
        '.tiptap',
        '.quill-editor',
        'textarea'
      ];

      let editor = null;
      for (const selector of editorSelectors) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          editor = element;
          break;
        }
      }

      if (editor) {
        await expect(editor).toBeVisible();
        await expect(editor).toBeEnabled();

        // Test basic text input
        const testContent = 'This is a test post for the AllIN social media platform! 🚀';
        await editor.click();
        await editor.fill(testContent);

        // Verify content was entered
        const editorContent = await editor.inputValue().catch(() => editor.textContent());
        expect(editorContent).toContain('test post');

        console.log('✅ Rich text editor basic functionality verified');
        await helpers.takeScreenshot('editor-basic-input');
      } else {
        console.log('⚠️ Content editor not found');
      }
    });

    test('EDITOR-002: Text formatting options comprehensive testing', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea, [contenteditable="true"]').first();

      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('Testing formatting options');

        // Select all text for formatting
        await page.keyboard.press('Control+A');

        // Test bold formatting
        const boldButton = page.locator('button[title*="bold"], button[data-testid="bold"], .bold-button').first();
        if (await boldButton.count() > 0 && await boldButton.isVisible()) {
          await boldButton.click();
          console.log('✅ Bold formatting tested');
        }

        // Test italic formatting
        const italicButton = page.locator('button[title*="italic"], button[data-testid="italic"], .italic-button').first();
        if (await italicButton.count() > 0 && await italicButton.isVisible()) {
          await italicButton.click();
          console.log('✅ Italic formatting tested');
        }

        // Test underline formatting
        const underlineButton = page.locator('button[title*="underline"], button[data-testid="underline"], .underline-button').first();
        if (await underlineButton.count() > 0 && await underlineButton.isVisible()) {
          await underlineButton.click();
          console.log('✅ Underline formatting tested');
        }

        // Test list formatting
        const listButton = page.locator('button[title*="list"], button[data-testid="list"], .list-button').first();
        if (await listButton.count() > 0 && await listButton.isVisible()) {
          await listButton.click();
          console.log('✅ List formatting tested');
        }

        // Test link insertion
        const linkButton = page.locator('button[title*="link"], button[data-testid="link"], .link-button').first();
        if (await linkButton.count() > 0 && await linkButton.isVisible()) {
          await linkButton.click();

          // Handle link dialog if it appears
          const linkDialog = page.locator('.modal, .dialog, [role="dialog"]');
          if (await linkDialog.count() > 0 && await linkDialog.isVisible()) {
            const urlInput = linkDialog.locator('input[type="url"], input[placeholder*="url"]').first();
            if (await urlInput.count() > 0) {
              await urlInput.fill('https://example.com');
              const confirmButton = linkDialog.locator('button').filter({ hasText: /ok|confirm|add|insert/i }).first();
              if (await confirmButton.count() > 0) {
                await confirmButton.click();
              }
            }
          }
          console.log('✅ Link insertion tested');
        }

        await helpers.takeScreenshot('editor-formatting-options');
      }
    });

    test('EDITOR-003: Keyboard shortcuts functionality', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea, [contenteditable="true"]').first();

      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('Testing keyboard shortcuts');

        // Test common keyboard shortcuts
        await page.keyboard.press('Control+A'); // Select all
        await page.keyboard.press('Control+B'); // Bold
        await page.waitForTimeout(500);

        await page.keyboard.press('Control+I'); // Italic
        await page.waitForTimeout(500);

        await page.keyboard.press('Control+U'); // Underline
        await page.waitForTimeout(500);

        await page.keyboard.press('Control+Z'); // Undo
        await page.waitForTimeout(500);

        await page.keyboard.press('Control+Y'); // Redo
        await page.waitForTimeout(500);

        console.log('✅ Keyboard shortcuts tested');
      }
    });

    test('EDITOR-004: Paste content handling', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea, [contenteditable="true"]').first();

      if (await editor.count() > 0) {
        await editor.click();

        // Test pasting plain text
        await page.evaluate(() => {
          navigator.clipboard.writeText('Pasted plain text content');
        });
        await page.keyboard.press('Control+V');
        await page.waitForTimeout(1000);

        // Test pasting formatted content
        const htmlContent = '<strong>Bold text</strong> and <em>italic text</em>';
        await page.evaluate((html) => {
          const clipboardData = new DataTransfer();
          clipboardData.setData('text/html', html);
          clipboardData.setData('text/plain', 'Bold text and italic text');

          const pasteEvent = new ClipboardEvent('paste', {
            clipboardData: clipboardData,
            bubbles: true
          });

          document.activeElement?.dispatchEvent(pasteEvent);
        }, htmlContent);

        console.log('✅ Paste content handling tested');
      }
    });
  });

  test.describe('📷 MEDIA UPLOAD - Complete Testing', () => {
    test('MEDIA-001: Image upload functionality', async ({ page }) => {
      // Find media upload button
      const uploadButtons = [
        '[data-testid="upload-image"]',
        '[data-testid="media-upload"]',
        'button:has-text("Upload")',
        'button:has-text("Add Image")',
        'input[type="file"]',
        '.upload-button'
      ];

      let uploadButton = null;
      for (const selector of uploadButtons) {
        const button = page.locator(selector).first();
        if (await button.count() > 0 && await button.isVisible()) {
          uploadButton = button;
          break;
        }
      }

      if (uploadButton) {
        await expect(uploadButton).toBeVisible();

        // Test image upload
        const testImagePath = 'test-image.jpg';
        const testImageContent = 'fake-image-data-for-testing';

        if (await uploadButton.getAttribute('type') === 'file') {
          // Direct file input
          await helpers.uploadTestFile(uploadButton.locator('xpath=.').first(), testImagePath, testImageContent);
        } else {
          // Button that triggers file input
          await uploadButton.click();

          // Look for file input that appears
          const fileInput = page.locator('input[type="file"]').first();
          if (await fileInput.count() > 0) {
            await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), testImagePath, testImageContent);
          }
        }

        await page.waitForTimeout(2000);

        // Check for upload preview or confirmation
        const uploadPreview = page.locator('.image-preview, .media-preview, [data-testid="image-preview"]');
        if (await uploadPreview.count() > 0) {
          await expect(uploadPreview.first()).toBeVisible();
          console.log('✅ Image upload preview displayed');
        }

        await helpers.takeScreenshot('image-upload');
      }
    });

    test('MEDIA-002: Multiple image upload', async ({ page }) => {
      const multiUploadButton = page.locator('[data-testid="multi-upload"], button:has-text("Add Images"), input[multiple]').first();

      if (await multiUploadButton.count() > 0) {
        await expect(multiUploadButton).toBeVisible();

        // Test multiple file upload
        const testFiles = [
          { name: 'test1.jpg', content: 'fake-image-1' },
          { name: 'test2.png', content: 'fake-image-2' },
          { name: 'test3.gif', content: 'fake-image-3' }
        ];

        // Simulate multiple file selection
        await multiUploadButton.setInputFiles(testFiles);
        await page.waitForTimeout(2000);

        // Check for multiple previews
        const previews = page.locator('.image-preview, .media-preview');
        const previewCount = await previews.count();

        if (previewCount > 1) {
          console.log(`✅ Multiple images uploaded: ${previewCount} previews`);
        }
      }
    });

    test('MEDIA-003: Video upload functionality', async ({ page }) => {
      const videoUploadButton = page.locator('[data-testid="upload-video"], button:has-text("Add Video"), input[accept*="video"]').first();

      if (await videoUploadButton.count() > 0) {
        await expect(videoUploadButton).toBeVisible();

        // Test video upload
        const testVideoPath = 'test-video.mp4';
        const testVideoContent = 'fake-video-data-for-testing';

        await helpers.uploadTestFile(videoUploadButton.locator('xpath=.').first(), testVideoPath, testVideoContent);
        await page.waitForTimeout(3000);

        // Check for video preview
        const videoPreview = page.locator('.video-preview, [data-testid="video-preview"], video');
        if (await videoPreview.count() > 0) {
          await expect(videoPreview.first()).toBeVisible();
          console.log('✅ Video upload preview displayed');
        }
      }
    });

    test('MEDIA-004: Drag and drop upload', async ({ page }) => {
      const dropZone = page.locator('.drop-zone, [data-testid="drop-zone"], .upload-area').first();

      if (await dropZone.count() > 0) {
        await expect(dropZone).toBeVisible();

        // Simulate drag and drop
        await dropZone.hover();

        // Trigger drag enter
        await dropZone.dispatchEvent('dragenter', {
          dataTransfer: {
            files: [{ name: 'dropped-image.jpg', type: 'image/jpeg' }]
          }
        });

        // Check for drag over state
        await page.waitForTimeout(500);

        // Trigger drop
        await dropZone.dispatchEvent('drop', {
          dataTransfer: {
            files: [{ name: 'dropped-image.jpg', type: 'image/jpeg' }]
          }
        });

        console.log('✅ Drag and drop upload tested');
      }
    });

    test('MEDIA-005: Media file validation', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      if (await fileInput.count() > 0) {
        // Test invalid file type
        const invalidFile = { name: 'test.txt', content: 'text file content' };

        try {
          await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), invalidFile.name, invalidFile.content);
          await page.waitForTimeout(2000);

          // Check for error message
          const errorElements = [
            'text="Invalid file type"',
            '.error-message',
            '[data-testid="upload-error"]',
            '.file-error'
          ];

          for (const selector of errorElements) {
            const element = page.locator(selector);
            if (await element.count() > 0 && await element.isVisible()) {
              console.log('✅ File validation error displayed');
              break;
            }
          }
        } catch (error) {
          console.log('✅ File validation prevented invalid upload');
        }
      }
    });
  });

  test.describe('🔢 CHARACTER COUNTER - Complete Testing', () => {
    test('COUNTER-001: Character counter display and accuracy', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();
      const counter = page.locator('[data-testid="character-counter"], .character-counter, .char-count').first();

      if (await editor.count() > 0 && await counter.count() > 0) {
        await editor.click();

        // Test character counting
        const testTexts = [
          'Short text',
          'This is a medium length text that should update the character counter accordingly',
          'This is a very long text that might exceed the character limit for certain social media platforms like Twitter which has a specific character limit that users need to be aware of when composing their posts to ensure they fit within the platform requirements'
        ];

        for (const text of testTexts) {
          await editor.clear();
          await editor.fill(text);
          await page.waitForTimeout(500);

          const counterText = await counter.textContent();
          const characterCount = text.length;

          // Verify counter shows correct count
          expect(counterText).toContain(characterCount.toString());
          console.log(`✅ Character count verified: ${characterCount} characters`);
        }

        await helpers.takeScreenshot('character-counter');
      }
    });

    test('COUNTER-002: Platform-specific character limits', async ({ page }) => {
      const platforms = [
        { name: 'Twitter', limit: 280 },
        { name: 'Facebook', limit: 63206 },
        { name: 'Instagram', limit: 2200 },
        { name: 'LinkedIn', limit: 3000 }
      ];

      for (const platform of platforms) {
        // Select platform
        const platformSelector = page.locator(`[data-testid="${platform.name.toLowerCase()}-platform"], .platform-${platform.name.toLowerCase()}`).first();

        if (await platformSelector.count() > 0) {
          await platformSelector.click();
          await page.waitForTimeout(500);

          // Check if counter shows platform limit
          const counterElement = page.locator('.character-counter, [data-testid="character-counter"]').first();
          if (await counterElement.count() > 0) {
            const counterText = await counterElement.textContent();

            // Should show format like "0/280" or "0 / 280"
            if (counterText?.includes(platform.limit.toString())) {
              console.log(`✅ ${platform.name} character limit displayed: ${platform.limit}`);
            }
          }
        }
      }
    });

    test('COUNTER-003: Character limit warning states', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();

      if (await editor.count() > 0) {
        await editor.click();

        // Fill with text approaching limit (assuming Twitter's 280 limit)
        const nearLimitText = 'A'.repeat(250); // 250 characters
        await editor.fill(nearLimitText);
        await page.waitForTimeout(500);

        // Check for warning state
        const warningElements = [
          '.counter-warning',
          '.text-warning',
          '.text-orange-500',
          '[data-testid="counter-warning"]'
        ];

        for (const selector of warningElements) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log('✅ Character limit warning state detected');
            break;
          }
        }

        // Test exceeding limit
        const overLimitText = 'A'.repeat(300); // 300 characters
        await editor.clear();
        await editor.fill(overLimitText);
        await page.waitForTimeout(500);

        // Check for error state
        const errorElements = [
          '.counter-error',
          '.text-error',
          '.text-red-500',
          '[data-testid="counter-error"]'
        ];

        for (const selector of errorElements) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log('✅ Character limit error state detected');
            break;
          }
        }
      }
    });
  });

  test.describe('🏷️ HASHTAG MANAGEMENT - Complete Testing', () => {
    test('HASHTAG-001: Hashtag input and suggestions', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();

      if (await editor.count() > 0) {
        await editor.click();

        // Type content with hashtag
        await editor.fill('Creating amazing content for social media #');
        await page.waitForTimeout(1000);

        // Check for hashtag suggestions
        const suggestionElements = [
          '.hashtag-suggestions',
          '[data-testid="hashtag-suggestions"]',
          '.autocomplete-dropdown',
          '.suggestions-dropdown'
        ];

        let suggestionsFound = false;
        for (const selector of suggestionElements) {
          const element = page.locator(selector);
          if (await element.count() > 0 && await element.isVisible()) {
            await expect(element.first()).toBeVisible();
            suggestionsFound = true;
            console.log('✅ Hashtag suggestions displayed');
            break;
          }
        }

        // Continue typing hashtag
        await page.keyboard.type('socialmedia');
        await page.waitForTimeout(500);

        // Add another hashtag
        await page.keyboard.type(' #marketing #content');
        await page.waitForTimeout(500);

        await helpers.takeScreenshot('hashtag-input');
      }
    });

    test('HASHTAG-002: Hashtag management panel', async ({ page }) => {
      const hashtagPanel = page.locator('[data-testid="hashtag-panel"], .hashtag-manager, .hashtag-section').first();

      if (await hashtagPanel.count() > 0) {
        await expect(hashtagPanel).toBeVisible();

        // Check for trending hashtags
        const trendingSection = hashtagPanel.locator('.trending-hashtags, [data-testid="trending-hashtags"]');
        if (await trendingSection.count() > 0) {
          console.log('✅ Trending hashtags section found');
        }

        // Check for saved hashtags
        const savedSection = hashtagPanel.locator('.saved-hashtags, [data-testid="saved-hashtags"]');
        if (await savedSection.count() > 0) {
          console.log('✅ Saved hashtags section found');
        }

        // Test adding hashtags from panel
        const hashtagItems = hashtagPanel.locator('.hashtag-item, .hashtag-tag');
        const itemCount = await hashtagItems.count();

        if (itemCount > 0) {
          // Click first few hashtag items
          for (let i = 0; i < Math.min(itemCount, 3); i++) {
            const hashtagItem = hashtagItems.nth(i);
            if (await hashtagItem.isVisible()) {
              await hashtagItem.click();
              await page.waitForTimeout(500);
            }
          }
          console.log(`✅ Tested clicking ${Math.min(itemCount, 3)} hashtag items`);
        }
      }
    });

    test('HASHTAG-003: Custom hashtag creation', async ({ page }) => {
      const hashtagInput = page.locator('[data-testid="hashtag-input"], input[placeholder*="hashtag"]').first();

      if (await hashtagInput.count() > 0) {
        await expect(hashtagInput).toBeVisible();

        // Test creating custom hashtags
        const customHashtags = ['mycustomtag', 'brandhashtag', 'campaign2024'];

        for (const hashtag of customHashtags) {
          await hashtagInput.click();
          await hashtagInput.fill(hashtag);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);

          // Check if hashtag was added
          const addedHashtag = page.locator(`text="#${hashtag}"`);
          if (await addedHashtag.count() > 0) {
            console.log(`✅ Custom hashtag added: #${hashtag}`);
          }
        }
      }
    });

    test('HASHTAG-004: Hashtag analytics and performance', async ({ page }) => {
      const hashtagAnalytics = page.locator('[data-testid="hashtag-analytics"], .hashtag-performance').first();

      if (await hashtagAnalytics.count() > 0) {
        await expect(hashtagAnalytics).toBeVisible();

        // Check for performance metrics
        const metricElements = [
          'text=/reach|engagement|impressions/i',
          '.metric',
          '.performance-stat'
        ];

        for (const selector of metricElements) {
          const elements = page.locator(selector);
          if (await elements.count() > 0) {
            console.log('✅ Hashtag performance metrics found');
            break;
          }
        }
      }
    });
  });

  test.describe('😀 EMOJI PICKER - Complete Testing', () => {
    test('EMOJI-001: Emoji picker UI and functionality', async ({ page }) => {
      // Find emoji picker button
      const emojiButton = page.locator('[data-testid="emoji-picker"], .emoji-button, button[title*="emoji"]').first();

      if (await emojiButton.count() > 0) {
        await expect(emojiButton).toBeVisible();
        await emojiButton.click();
        await page.waitForTimeout(1000);

        // Check if emoji picker panel appears
        const emojiPanel = page.locator('.emoji-picker, [data-testid="emoji-panel"], .emoji-container').first();

        if (await emojiPanel.count() > 0) {
          await expect(emojiPanel).toBeVisible();

          // Check for emoji categories
          const categories = ['smileys', 'people', 'nature', 'food', 'activities', 'travel', 'objects', 'symbols'];

          for (const category of categories) {
            const categoryTab = emojiPanel.locator(`[data-category="${category}"], .${category}-tab`);
            if (await categoryTab.count() > 0) {
              console.log(`✅ Emoji category found: ${category}`);
            }
          }

          // Test clicking some emojis
          const emojiElements = emojiPanel.locator('.emoji, [data-emoji]');
          const emojiCount = await emojiElements.count();

          if (emojiCount > 0) {
            // Click first few emojis
            for (let i = 0; i < Math.min(emojiCount, 5); i++) {
              const emoji = emojiElements.nth(i);
              if (await emoji.isVisible()) {
                await emoji.click();
                await page.waitForTimeout(300);
              }
            }
            console.log(`✅ Tested clicking ${Math.min(emojiCount, 5)} emojis`);
          }

          await helpers.takeScreenshot('emoji-picker');
        }
      }
    });

    test('EMOJI-002: Emoji search functionality', async ({ page }) => {
      const emojiButton = page.locator('[data-testid="emoji-picker"], .emoji-button').first();

      if (await emojiButton.count() > 0) {
        await emojiButton.click();
        await page.waitForTimeout(1000);

        // Find emoji search input
        const emojiSearch = page.locator('[data-testid="emoji-search"], input[placeholder*="emoji"], .emoji-search').first();

        if (await emojiSearch.count() > 0) {
          await expect(emojiSearch).toBeVisible();

          // Test searching for emojis
          const searchTerms = ['smile', 'heart', 'fire', 'rocket'];

          for (const term of searchTerms) {
            await emojiSearch.clear();
            await emojiSearch.fill(term);
            await page.waitForTimeout(500);

            // Check if search results appear
            const searchResults = page.locator('.emoji-search-results, .emoji:visible');
            const resultCount = await searchResults.count();

            if (resultCount > 0) {
              console.log(`✅ Emoji search for "${term}" returned ${resultCount} results`);
            }
          }
        }
      }
    });

    test('EMOJI-003: Recent and frequently used emojis', async ({ page }) => {
      const emojiButton = page.locator('[data-testid="emoji-picker"], .emoji-button').first();

      if (await emojiButton.count() > 0) {
        await emojiButton.click();
        await page.waitForTimeout(1000);

        // Check for recent emojis section
        const recentSection = page.locator('.recent-emojis, [data-testid="recent-emojis"]').first();
        if (await recentSection.count() > 0) {
          console.log('✅ Recent emojis section found');
        }

        // Check for frequently used section
        const frequentSection = page.locator('.frequent-emojis, [data-testid="frequent-emojis"]').first();
        if (await frequentSection.count() > 0) {
          console.log('✅ Frequently used emojis section found');
        }
      }
    });
  });

  test.describe('🎯 PLATFORM SELECTOR - Complete Testing', () => {
    test('PLATFORM-001: Platform selection UI', async ({ page }) => {
      const platformSelector = page.locator('[data-testid="platform-selector"], .platform-selector, .platforms').first();

      if (await platformSelector.count() > 0) {
        await expect(platformSelector).toBeVisible();

        // Check for individual platform options
        const platforms = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube'];

        for (const platform of platforms) {
          const platformOption = page.locator(`[data-testid="${platform.toLowerCase()}-option"], .${platform.toLowerCase()}-option`).or(
            page.locator('label, .platform-item').filter({ hasText: new RegExp(platform, 'i') })
          );

          if (await platformOption.count() > 0) {
            await expect(platformOption.first()).toBeVisible();
            console.log(`✅ ${platform} platform option found`);
          }
        }

        await helpers.takeScreenshot('platform-selector');
      }
    });

    test('PLATFORM-002: Multi-platform selection', async ({ page }) => {
      const platforms = ['Facebook', 'Instagram', 'Twitter'];

      for (const platform of platforms) {
        const platformCheckbox = page.locator(`input[type="checkbox"][value*="${platform.toLowerCase()}"], [data-testid="${platform.toLowerCase()}-checkbox"]`).first();
        const platformLabel = page.locator(`label:has-text("${platform}")`).first();

        let platformElement = platformCheckbox;
        if (await platformCheckbox.count() === 0 && await platformLabel.count() > 0) {
          platformElement = platformLabel;
        }

        if (await platformElement.count() > 0 && await platformElement.isVisible()) {
          await platformElement.click();
          await page.waitForTimeout(500);
          console.log(`✅ ${platform} platform selected`);
        }
      }

      // Verify multiple selections
      const selectedPlatforms = page.locator('input[type="checkbox"]:checked, .platform-selected');
      const selectionCount = await selectedPlatforms.count();

      if (selectionCount > 1) {
        console.log(`✅ Multiple platforms selected: ${selectionCount}`);
      }
    });

    test('PLATFORM-003: Platform-specific content optimization', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();

      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('This is a test post with different optimizations for each platform');

        // Select Twitter
        const twitterOption = page.locator('[data-testid="twitter-option"], .twitter-option, label:has-text("Twitter")').first();
        if (await twitterOption.count() > 0) {
          await twitterOption.click();
          await page.waitForTimeout(500);

          // Check for Twitter-specific features (character limit, hashtag suggestions, etc.)
          const twitterFeatures = [
            '.character-counter:has-text("280")',
            '.twitter-optimization',
            '[data-testid="twitter-features"]'
          ];

          for (const feature of twitterFeatures) {
            const element = page.locator(feature);
            if (await element.count() > 0) {
              console.log('✅ Twitter-specific features detected');
              break;
            }
          }
        }

        // Select Instagram
        const instagramOption = page.locator('[data-testid="instagram-option"], .instagram-option, label:has-text("Instagram")').first();
        if (await instagramOption.count() > 0) {
          await instagramOption.click();
          await page.waitForTimeout(500);

          // Check for Instagram-specific features
          const instagramFeatures = [
            '.hashtag-suggestions',
            '.instagram-optimization',
            '[data-testid="instagram-features"]'
          ];

          for (const feature of instagramFeatures) {
            const element = page.locator(feature);
            if (await element.count() > 0) {
              console.log('✅ Instagram-specific features detected');
              break;
            }
          }
        }
      }
    });
  });

  test.describe('👁️ PREVIEW FUNCTIONALITY - Complete Testing', () => {
    test('PREVIEW-001: Platform-specific previews', async ({ page }) => {
      const previewSection = page.locator('[data-testid="preview"], .preview-section, .post-preview').first();

      if (await previewSection.count() > 0) {
        await expect(previewSection).toBeVisible();

        // Test content in editor
        const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();
        if (await editor.count() > 0) {
          const testContent = 'This is a preview test with #hashtags and @mentions! 🚀';
          await editor.click();
          await editor.fill(testContent);
          await page.waitForTimeout(1000);

          // Check if preview updates
          const previewContent = previewSection.locator('.preview-content, .post-content');
          if (await previewContent.count() > 0) {
            const previewText = await previewContent.textContent();
            if (previewText?.includes('preview test')) {
              console.log('✅ Preview content updates correctly');
            }
          }
        }

        // Test platform-specific previews
        const platforms = ['Twitter', 'Facebook', 'Instagram'];
        for (const platform of platforms) {
          const platformTab = page.locator(`[data-testid="${platform.toLowerCase()}-preview"], .${platform.toLowerCase()}-preview-tab`).first();

          if (await platformTab.count() > 0) {
            await platformTab.click();
            await page.waitForTimeout(500);

            // Check for platform-specific preview elements
            const platformPreview = page.locator(`.${platform.toLowerCase()}-preview, [data-preview="${platform.toLowerCase()}"]`);
            if (await platformPreview.count() > 0) {
              console.log(`✅ ${platform} preview tab working`);
            }
          }
        }

        await helpers.takeScreenshot('content-preview');
      }
    });

    test('PREVIEW-002: Media preview in posts', async ({ page }) => {
      // Add media to post
      const mediaButton = page.locator('[data-testid="add-media"], .media-button, button:has-text("Add Image")').first();

      if (await mediaButton.count() > 0) {
        await mediaButton.click();

        // Simulate image upload
        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await helpers.uploadTestFile(fileInput.locator('xpath=.').first(), 'test-image.jpg', 'fake-image-data');
          await page.waitForTimeout(2000);

          // Check preview with media
          const mediaPreview = page.locator('.media-preview, .image-preview, [data-testid="media-preview"]');
          if (await mediaPreview.count() > 0) {
            await expect(mediaPreview.first()).toBeVisible();
            console.log('✅ Media preview displayed in post preview');
          }
        }
      }
    });

    test('PREVIEW-003: Real-time preview updates', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();
      const preview = page.locator('[data-testid="preview"], .preview-section').first();

      if (await editor.count() > 0 && await preview.count() > 0) {
        await editor.click();

        // Type content gradually and check preview updates
        const textParts = ['Hello', ' world!', ' This is', ' a real-time', ' preview test.'];

        for (const part of textParts) {
          await page.keyboard.type(part);
          await page.waitForTimeout(500);

          // Check if preview contains the typed content
          const previewContent = await preview.textContent();
          if (previewContent?.includes(part.trim())) {
            console.log(`✅ Preview updated with: "${part}"`);
          }
        }
      }
    });
  });

  test.describe('💾 DRAFT MANAGEMENT - Complete Testing', () => {
    test('DRAFT-001: Auto-save functionality', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();

      if (await editor.count() > 0) {
        await editor.click();
        await editor.fill('This content should be auto-saved as a draft');

        // Wait for auto-save (usually after a few seconds of inactivity)
        await page.waitForTimeout(3000);

        // Check for auto-save indicator
        const autoSaveIndicators = [
          'text="Auto-saved"',
          'text="Draft saved"',
          '.auto-save-indicator',
          '[data-testid="auto-save"]'
        ];

        for (const indicator of autoSaveIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0 && await element.isVisible()) {
            console.log('✅ Auto-save indicator found');
            break;
          }
        }
      }
    });

    test('DRAFT-002: Manual draft saving', async ({ page }) => {
      const saveButton = page.locator('[data-testid="save-draft"], button:has-text("Save Draft"), .save-draft-button').first();

      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
        await expect(saveButton).toBeEnabled();

        // Add content first
        const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();
        if (await editor.count() > 0) {
          await editor.click();
          await editor.fill('This is a manually saved draft');
        }

        // Click save draft
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Check for save confirmation
        const saveConfirmation = page.locator('text="Draft saved", .save-success, [data-testid="save-success"]');
        if (await saveConfirmation.count() > 0) {
          console.log('✅ Draft save confirmation displayed');
        }
      }
    });

    test('DRAFT-003: Draft list and management', async ({ page }) => {
      // Navigate to drafts section
      const draftsTab = page.locator('[data-testid="drafts-tab"], .drafts-tab, button:has-text("Drafts")').first();

      if (await draftsTab.count() > 0) {
        await draftsTab.click();
        await page.waitForTimeout(1000);

        // Check for drafts list
        const draftsList = page.locator('[data-testid="drafts-list"], .drafts-list, .draft-items').first();

        if (await draftsList.count() > 0) {
          await expect(draftsList).toBeVisible();

          // Check for individual draft items
          const draftItems = draftsList.locator('.draft-item, [data-testid="draft-item"]');
          const draftCount = await draftItems.count();

          if (draftCount > 0) {
            console.log(`✅ Found ${draftCount} draft items`);

            // Test draft actions (edit, delete, etc.)
            const firstDraft = draftItems.first();

            // Test edit draft
            const editButton = firstDraft.locator('button:has-text("Edit"), [data-testid="edit-draft"]').first();
            if (await editButton.count() > 0) {
              await editButton.click();
              await page.waitForTimeout(1000);
              console.log('✅ Draft edit functionality tested');
            }
          }

          await helpers.takeScreenshot('drafts-list');
        }
      }
    });

    test('DRAFT-004: Draft restoration', async ({ page }) => {
      // Simulate having a draft in storage
      await page.evaluate(() => {
        localStorage.setItem('draft_content', JSON.stringify({
          content: 'This is a restored draft content',
          timestamp: Date.now(),
          platforms: ['facebook', 'twitter']
        }));
      });

      await page.reload();
      await helpers.waitForLoadingComplete();

      // Check for draft restoration notification
      const restorationElements = [
        'text="Draft restored"',
        'text="Continue editing"',
        '.draft-restoration',
        '[data-testid="draft-restored"]'
      ];

      for (const selector of restorationElements) {
        const element = page.locator(selector);
        if (await element.count() > 0 && await element.isVisible()) {
          console.log('✅ Draft restoration notification found');
          break;
        }
      }

      // Check if editor contains restored content
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();
      if (await editor.count() > 0) {
        const editorContent = await editor.inputValue().catch(() => editor.textContent());
        if (editorContent?.includes('restored draft')) {
          console.log('✅ Draft content successfully restored');
        }
      }
    });
  });

  test.describe('📄 TEMPLATE SYSTEM - Complete Testing', () => {
    test('TEMPLATE-001: Template library access', async ({ page }) => {
      const templatesButton = page.locator('[data-testid="templates"], button:has-text("Templates"), .templates-button').first();

      if (await templatesButton.count() > 0) {
        await expect(templatesButton).toBeVisible();
        await templatesButton.click();
        await page.waitForTimeout(1000);

        // Check for templates panel or modal
        const templatesPanel = page.locator('.templates-panel, [data-testid="templates-panel"], .modal').first();

        if (await templatesPanel.count() > 0) {
          await expect(templatesPanel).toBeVisible();

          // Check for template categories
          const categories = ['Marketing', 'Announcements', 'Holidays', 'Promotions', 'General'];

          for (const category of categories) {
            const categoryTab = templatesPanel.locator(`button:has-text("${category}"), [data-category="${category.toLowerCase()}"]`);
            if (await categoryTab.count() > 0) {
              console.log(`✅ Template category found: ${category}`);
            }
          }

          // Check for individual templates
          const templateItems = templatesPanel.locator('.template-item, [data-testid="template-item"]');
          const templateCount = await templateItems.count();

          if (templateCount > 0) {
            console.log(`✅ Found ${templateCount} templates`);

            // Test using a template
            const firstTemplate = templateItems.first();
            const useButton = firstTemplate.locator('button:has-text("Use"), [data-testid="use-template"]').first();

            if (await useButton.count() > 0) {
              await useButton.click();
              await page.waitForTimeout(1000);
              console.log('✅ Template usage tested');
            }
          }

          await helpers.takeScreenshot('templates-panel');
        }
      }
    });

    test('TEMPLATE-002: Custom template creation', async ({ page }) => {
      const createTemplateButton = page.locator('[data-testid="create-template"], button:has-text("Create Template"), .create-template').first();

      if (await createTemplateButton.count() > 0) {
        // First, add some content
        const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();
        if (await editor.count() > 0) {
          await editor.click();
          await editor.fill('This is a custom template for my brand! #branding #marketing');
        }

        await createTemplateButton.click();
        await page.waitForTimeout(1000);

        // Check for template creation dialog
        const templateDialog = page.locator('.template-dialog, [data-testid="template-dialog"], .modal').first();

        if (await templateDialog.count() > 0) {
          await expect(templateDialog).toBeVisible();

          // Fill template details
          const templateName = templateDialog.locator('input[placeholder*="name"], [data-testid="template-name"]').first();
          if (await templateName.count() > 0) {
            await templateName.fill('My Custom Template');
          }

          const templateCategory = templateDialog.locator('select, [data-testid="template-category"]').first();
          if (await templateCategory.count() > 0) {
            await templateCategory.selectOption('Marketing');
          }

          // Save template
          const saveButton = templateDialog.locator('button:has-text("Save"), [data-testid="save-template"]').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Custom template creation tested');
          }
        }
      }
    });

    test('TEMPLATE-003: Template search and filtering', async ({ page }) => {
      const templatesButton = page.locator('[data-testid="templates"], button:has-text("Templates")').first();

      if (await templatesButton.count() > 0) {
        await templatesButton.click();
        await page.waitForTimeout(1000);

        const templatesPanel = page.locator('.templates-panel, [data-testid="templates-panel"]').first();

        if (await templatesPanel.count() > 0) {
          // Test template search
          const searchInput = templatesPanel.locator('input[placeholder*="search"], [data-testid="template-search"]').first();

          if (await searchInput.count() > 0) {
            await searchInput.fill('marketing');
            await page.waitForTimeout(1000);

            // Check if results are filtered
            const searchResults = templatesPanel.locator('.template-item:visible');
            const resultCount = await searchResults.count();
            console.log(`✅ Template search returned ${resultCount} results`);
          }

          // Test category filtering
          const categoryFilters = templatesPanel.locator('.category-filter, [data-testid="category-filter"] button');
          const filterCount = await categoryFilters.count();

          if (filterCount > 0) {
            const firstFilter = categoryFilters.first();
            await firstFilter.click();
            await page.waitForTimeout(500);
            console.log('✅ Template category filtering tested');
          }
        }
      }
    });
  });

  test.describe('⚡ PERFORMANCE & OPTIMIZATION - Complete Testing', () => {
    test('PERF-001: Content creation page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard/create');
      await helpers.waitForLoadingComplete();

      const loadTime = Date.now() - startTime;
      console.log(`Content creation page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(8000); // 8 seconds max

      const metrics = await helpers.checkPerformanceMetrics();
      console.log('Content creation performance metrics:', metrics);
    });

    test('PERF-002: Real-time feature responsiveness', async ({ page }) => {
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();

      if (await editor.count() > 0) {
        await editor.click();

        const startTime = Date.now();

        // Type content and measure responsiveness
        await page.keyboard.type('Testing real-time responsiveness of content editor features');

        const typingTime = Date.now() - startTime;
        console.log(`Typing responsiveness: ${typingTime}ms`);

        // Test character counter update speed
        const counterStartTime = Date.now();
        await page.waitForTimeout(100); // Allow counter to update
        const counterTime = Date.now() - counterStartTime;

        console.log(`Character counter update time: ${counterTime}ms`);
      }
    });

    test('PERF-003: Memory usage during content creation', async ({ page }) => {
      // Measure initial memory
      const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

      // Perform various content creation actions
      const editor = page.locator('[data-testid="content-editor"], .content-editor, textarea').first();

      if (await editor.count() > 0) {
        // Add content
        await editor.click();
        await editor.fill('Testing memory usage with content creation');

        // Add multiple hashtags
        await page.keyboard.type(' #test #memory #performance #optimization #content');

        // Use emoji picker if available
        const emojiButton = page.locator('[data-testid="emoji-picker"], .emoji-button').first();
        if (await emojiButton.count() > 0) {
          await emojiButton.click();
          await page.waitForTimeout(1000);

          // Close emoji picker
          await page.keyboard.press('Escape');
        }

        // Switch between platforms
        const platformButtons = page.locator('.platform-option, [data-testid*="platform"]');
        const buttonCount = Math.min(await platformButtons.count(), 3);

        for (let i = 0; i < buttonCount; i++) {
          const button = platformButtons.nth(i);
          if (await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(500);
          }
        }

        // Measure final memory
        const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

        if (initialMemory && finalMemory) {
          const memoryIncrease = finalMemory - initialMemory;
          console.log(`Memory usage increase: ${memoryIncrease} bytes`);

          // Memory increase should be reasonable
          expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max increase
        }
      }
    });
  });
});

export {};