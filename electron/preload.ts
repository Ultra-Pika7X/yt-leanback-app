import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    downloadVideo: (options: any) => ipcRenderer.invoke('download-video', options),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    setSetting: (key: string, value: any) => ipcRenderer.invoke('set-setting', key, value),
});

// Store cache
let appSettings = {
    adblock: true,
    downloader: true,
    discordRpc: true
};

// Initialize Settings
ipcRenderer.invoke('get-settings').then(settings => {
    appSettings = { ...appSettings, ...settings };
    console.log('Settings Loaded:', appSettings);
});

// DOM Injection Logic
window.addEventListener('DOMContentLoaded', () => {

    // --- SHARED UI HELPERS ---
    const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        let container = document.getElementById('yt-leanback-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'yt-leanback-notification-container';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.left = '20px';
            container.style.zIndex = '99999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            document.body.appendChild(container); // Inject into body
        }

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '4px';
        toast.style.color = '#fff';
        toast.style.fontFamily = '"Roboto", "Arial", sans-serif';
        toast.style.fontSize = '14px';
        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';

        if (type === 'success') toast.style.backgroundColor = '#2ba640'; // Green
        else if (type === 'error') toast.style.backgroundColor = '#cc0000'; // Red
        else toast.style.backgroundColor = '#3ea6ff'; // Blue

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    ipcRenderer.on('download-status', (event, data) => {
        if (data.status === 'started') showNotification('Download Started...', 'info');
        if (data.status === 'success') showNotification('Download Complete!', 'success');
        if (data.status === 'error') showNotification(`Download Failed: ${data.message}`, 'error');
    });

    const createModalOverlay = () => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
        overlay.style.zIndex = '10000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        return overlay;
    };

    const createMenu = () => {
        const menu = document.createElement('div');
        menu.style.backgroundColor = '#212121';
        menu.style.borderRadius = '2px';
        menu.style.padding = '16px 0';
        menu.style.minWidth = '300px';
        menu.style.boxShadow = '0 12px 24px rgba(0,0,0,0.5)';
        menu.style.fontFamily = 'inherit';
        return menu;
    };

    const createMenuItem = (label: string, onClick: () => void, isSelected = false) => {
        const btn = document.createElement('div');
        btn.textContent = label;
        btn.style.padding = '10px 24px';
        btn.style.color = '#eee';
        btn.style.fontSize = '16px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background-color 0.1s';

        // Emulate native focus/hover
        btn.onmouseenter = () => btn.style.backgroundColor = 'rgba(255,255,255,0.1)';
        btn.onmouseleave = () => btn.style.backgroundColor = 'transparent';

        if (isSelected) {
            btn.innerHTML = `<span style="color: #3ea6ff; margin-right: 8px;">✓</span> ${label}`;
        }

        btn.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
        return btn;
    };


    // --- SUBMENU LOGIC (Downloader) ---
    const openDownloadSubmenu = () => {
        const overlay = createModalOverlay();
        const menu = createMenu();

        const header = document.createElement('div');
        header.textContent = 'Download Method';
        header.style.padding = '0 24px 12px 24px';
        header.style.color = '#aaa';
        header.style.fontSize = '14px';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        header.style.marginBottom = '8px';
        menu.appendChild(header);

        menu.appendChild(createMenuItem('Standard Download (MP4 360p)', () => {
            ipcRenderer.invoke('download-video', { provider: 'ytdl' });
            overlay.remove();
        }));

        menu.appendChild(createMenuItem('Browser (SaveFrom.net)', () => {
            ipcRenderer.invoke('download-video', { provider: 'savefrom' });
            overlay.remove();
        }));

        const closeBtn = createMenuItem('Cancel', () => overlay.remove());
        closeBtn.style.color = '#aaa';
        menu.appendChild(closeBtn);

        overlay.appendChild(menu);
        document.body.appendChild(overlay);
        overlay.onclick = () => overlay.remove();
    };


    // --- SETTINGS SUBMENU LOGIC ---
    const openSettingToggleMenu = (label: string, key: 'adblock' | 'downloader' | 'discordRpc', refreshUI: () => void) => {
        const overlay = createModalOverlay();
        const menu = createMenu();

        const header = document.createElement('div');
        header.textContent = label;
        header.style.padding = '0 24px 12px 24px';
        header.style.color = '#aaa';
        header.style.fontSize = '14px';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        header.style.marginBottom = '8px';
        menu.appendChild(header);

        menu.appendChild(createMenuItem('On', () => {
            appSettings[key] = true;
            ipcRenderer.invoke('set-setting', key, true);
            refreshUI();
            overlay.remove();
        }, appSettings[key] === true));

        menu.appendChild(createMenuItem('Off', () => {
            appSettings[key] = false;
            ipcRenderer.invoke('set-setting', key, false);
            refreshUI();
            overlay.remove();
        }, appSettings[key] === false));

        overlay.appendChild(menu);
        document.body.appendChild(overlay);
        overlay.onclick = () => overlay.remove();
    };


    // --- SETTINGS INJECTION ---
    const injectSettingsNodes = () => {
        // Target: "About" section in settings.
        // We look for any text node "About" inside the settings view.

        if (document.getElementById('leanback-optional-features')) return;

        // We need the main list container to append our group to.
        // Usually it's `div.content-container` inside `yt-settings-view`.
        let listContainer = document.querySelector('yt-settings-view .content-container');

        // Fallback: look for generic list
        if (!listContainer) {
            const lists = document.querySelectorAll('[role="list"]');
            for (const list of Array.from(lists)) {
                if (list.textContent && list.textContent.includes('About')) {
                    listContainer = list;
                    break;
                }
            }
        }

        if (!listContainer) return;

        // Verify we are actually in the root settings menu
        // (If we see "Parental Controls" or "App" or "About")
        if (!listContainer.textContent?.includes('About')) return;

        console.log('Settings View (Root) Detected, injecting Optional Features...');

        const container = document.createElement('div');
        container.id = 'leanback-optional-features';
        // Style to look like a group separator
        container.style.marginTop = '30px';
        container.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        container.style.paddingTop = '30px';

        const header = document.createElement('div');
        header.textContent = 'Optional Features';
        // Match the "About" or "App" header style if possible
        // Usually: font-weight bold, color #aaa or #fff
        header.style.fontSize = '18px'; // standard leanback header size
        header.style.fontWeight = '500';
        header.style.color = '#aaa'; // Secondary color for headers
        header.style.padding = '0 48px'; // Standard padding
        header.style.marginBottom = '12px';
        header.style.fontFamily = 'inherit';
        container.appendChild(header);

        const createSettingsRow = (label: string, key: 'adblock' | 'downloader' | 'discordRpc') => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.padding = '12px 48px'; // Match standard item padding
            row.style.cursor = 'pointer';
            row.style.fontFamily = 'inherit';

            const text = document.createElement('div');
            text.style.flex = '1';
            text.textContent = label;
            text.style.fontSize = '18px';
            text.style.color = '#eee'; // Primary text
            text.style.fontFamily = 'inherit';

            const state = document.createElement('div');
            state.textContent = appSettings[key] ? 'On' : 'Off';
            state.style.fontSize = '16px';
            state.style.color = '#aaa'; // Secondary text
            state.style.fontFamily = 'inherit';

            // Refresh state text helper
            const refresh = () => {
                state.textContent = appSettings[key] ? 'On' : 'Off';
            };

            row.onmouseenter = () => row.style.backgroundColor = 'rgba(255,255,255,0.1)';
            row.onmouseleave = () => row.style.backgroundColor = 'transparent';

            row.onclick = () => {
                openSettingToggleMenu(label, key, refresh);
            };

            row.appendChild(text);
            row.appendChild(state);
            return row;
        };

        container.appendChild(createSettingsRow('Adblocker', 'adblock'));
        container.appendChild(createSettingsRow('Video Downloader', 'downloader'));
        container.appendChild(createSettingsRow('Discord Rich Presence', 'discordRpc'));

        // Append to the end of the list (which is usually where About is)
        listContainer.appendChild(container);
    };


    // --- MENU INJECTION (Downloader) ---
    const injectIntoMenu = () => {
        if (!appSettings.downloader) return;

        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], .yt-paper-item, .components-button'));

        // Find "Captions"
        let captionsItem: Element | null = null;
        for (const item of menuItems) {
            // Check text content. Careful not to match our already changed item.
            if (item.textContent && item.textContent.includes('Captions') && !item.hasAttribute('data-download-hijacked')) {
                captionsItem = item;
                break;
            }
        }

        if (!captionsItem) return;

        console.log('[Preload] Found Captions item. Hijacking...');

        const oldElement = captionsItem as HTMLElement;
        const newElement = oldElement.cloneNode(true) as HTMLElement;
        newElement.setAttribute('data-download-hijacked', 'true');

        const stopEvent = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        };

        const handleClick = () => {
            openDownloadSubmenu();
        };

        newElement.addEventListener('click', (e) => { stopEvent(e); handleClick(); }, true);
        newElement.addEventListener('keydown', (e: any) => {
            if (e.key === 'Enter' || e.key === ' ') {
                stopEvent(e);
                handleClick();
            }
        }, true);

        // Enforce Content - PREVENT LOOPING TEXT
        const enforceContent = () => {
            newElement.removeAttribute('title');
            newElement.removeAttribute('aria-label');

            const walker = document.createTreeWalker(newElement, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            let primaryLabelSet = false;

            while (node = walker.nextNode()) {
                const currentText = node.nodeValue?.trim();
                if (!currentText) continue;

                // Logic:
                // The first significant text node we find -> "Download Video"
                // ALL other text nodes -> "" (Empty)

                if (!primaryLabelSet) {
                    // This is the Main Label
                    if (currentText !== 'Download Video') {
                        node.nodeValue = 'Download Video';
                    }
                    primaryLabelSet = true;
                } else {
                    // This is a Secondary Label (e.g. "Off", or the duplicate "Download Video")
                    // CLEAR IT
                    if (node.nodeValue !== '') {
                        node.nodeValue = '';
                    }
                }
            }

            const svg = newElement.querySelector('svg');
            if (svg) {
                if (!svg.innerHTML.includes('M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z')) {
                    svg.innerHTML = `
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path>
                    `;
                    svg.setAttribute('viewBox', '0 0 24 24');
                }
            }

            const distractions = newElement.querySelectorAll('.yt-utils-icon-arrow, .right-icon, .yt-badge, .badge');
            distractions.forEach(el => el.remove());
        };

        enforceContent();

        const contentGuard = new MutationObserver(() => {
            contentGuard.disconnect();
            enforceContent();
            contentGuard.observe(newElement, { subtree: true, childList: true, characterData: true, attributes: true });
        });
        contentGuard.observe(newElement, { subtree: true, childList: true, characterData: true, attributes: true });

        oldElement.replaceWith(newElement);
    };


    // Global Observer
    const observer = new MutationObserver(() => {
        injectIntoMenu();
        injectSettingsNodes();
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
