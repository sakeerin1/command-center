/**
 * ==========================================================================
 * GOOGLE API INTEGRATION HELPER (googleApiHelper.js)
 * Supports Google Auth 2.0, Gmail readonly, and Google Calendar write APIs.
 * Includes Sandbox Mode for instant simulation without Client ID.
 * ==========================================================================
 */

const GoogleAPIHelper = {
    tokenClient: null,
    accessToken: localStorage.getItem('cc_g_token') || null,
    clientId: localStorage.getItem('cc_g_client_id') || '',
    scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events',
    isSandbox: true,

    init: function(clientIdVal) {
        if (clientIdVal) {
            this.clientId = clientIdVal;
            localStorage.setItem('cc_g_client_id', clientIdVal);
            this.isSandbox = false;
        } else {
            this.isSandbox = true;
        }

        if (typeof window !== 'undefined' && !window.google && !document.getElementById('google-gis-script')) {
            const script = document.createElement('script');
            script.id = 'google-gis-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => this.setupTokenClient();
            document.head.appendChild(script);
        } else if (typeof window !== 'undefined' && window.google) {
            this.setupTokenClient();
        }
    },

    setupTokenClient: function() {
        if (this.isSandbox || !this.clientId) return;
        try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.scopes,
                callback: (tokenResponse) => {
                    if (tokenResponse.access_token) {
                        this.accessToken = tokenResponse.access_token;
                        localStorage.setItem('cc_g_token', this.accessToken);
                        if (this.onAuthSuccessCallback) {
                            this.onAuthSuccessCallback(this.accessToken);
                        }
                    }
                },
            });
        } catch (e) {
            console.error('Error initializing Google Token Client: ', e);
        }
    },

    login: function(onSuccess) {
        this.onAuthSuccessCallback = onSuccess;
        if (this.isSandbox) {
            setTimeout(() => {
                this.accessToken = 'sandbox_token_' + Date.now();
                localStorage.setItem('cc_g_token', this.accessToken);
                if (onSuccess) onSuccess(this.accessToken);
            }, 500);
            return;
        }

        if (this.tokenClient) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            alert('กำลังโหลดสคริปต์ความปลอดภัยจาก Google กรุณารอสักครู่ครับ');
            this.init(this.clientId);
        }
    },

    logout: function() {
        this.accessToken = null;
        localStorage.removeItem('cc_g_token');
    },

    isConnected: function() {
        return !!this.accessToken;
    },

    addCalendarEvent: function(summary, description, startDateTimeStr, callback) {
        if (this.isSandbox) {
            setTimeout(() => {
                if (callback) callback(true, 'https://calendar.google.com');
            }, 600);
            return;
        }

        const event = {
            summary: summary,
            description: description,
            start: { dateTime: new Date(startDateTimeStr).toISOString() },
            end: { dateTime: new Date(new Date(startDateTimeStr).getTime() + 60 * 60 * 1000).toISOString() }
        };

        fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        })
        .then(res => res.json())
        .then(data => {
            if (data.htmlLink && callback) callback(true, data.htmlLink);
            else if (callback) callback(false, null);
        })
        .catch(err => {
            console.error(err);
            if (callback) callback(false, null);
        });
    }
};

if (typeof module !== 'undefined') {
    module.exports = GoogleAPIHelper;
}
