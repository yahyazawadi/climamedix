# Domain & Email Configuration Guide: `climamedix.org`

This document details the exact setup implemented for connecting **`climamedix.org`** to the ClimaMedix PWA via Cloudflare, and configuring full inbound/outbound email capabilities (`contact@climamedix.org`) through Gmail without paid email hosting.

---

## 1. Architecture Overview

```
                      +------------------------------------------+
                      |         Namecheap Registrar              |
                      |  Nameservers: hans & jule.ns.cloudflare  |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |            Cloudflare DNS                |
                      +--------------------+---------------------+
                                           |
             +-----------------------------+-----------------------------+
             |                                                           |
             v                                                           v
   [ Web Traffic ]                                              [ Email Traffic ]
+-------------------------+                                   +-------------------------+
| Cloudflare Pages        |                                   | Cloudflare Email Routing|
| climamedix.pages.dev    |                                   | (Inbound Catch-All)     |
| SSL: Google Trust (Auto)|                                   +------------+------------+
+-------------------------+                                                |
                                                                           v
                                                              +-------------------------+
                                                              |  climamedix@gmail.com   |
                                                              |  (Destination Inbox)    |
                                                              +------------+------------+
                                                                           |
                                                              [ Outbound SMTP via Gmail ]
                                                              +------------+------------+
                                                              | smtp.gmail.com:587      |
                                                              | User: climamedix@gmail  |
                                                              | Auth: App Password      |
                                                              | Sender: contact@...     |
                                                              +-------------------------+
```

---

## 2. Web Hosting & Domain Connection (Cloudflare Pages)

### Step 1: Nameserver Delegation
- **Registrar**: Namecheap
- **Domain**: `climamedix.org`
- **Nameservers Configuration**: Changed from *Namecheap BasicDNS* to *Custom DNS*:
  - `hans.ns.cloudflare.com`
  - `jule.ns.cloudflare.com`

### Step 2: Cloudflare Pages Custom Domains
Both apex and `www` were attached to the Pages project `climamedix` (`climamedix.pages.dev`):
- `climamedix.org`
- `www.climamedix.org`
- **DNS Records Created**:
  - `CNAME` | `@` | `climamedix.pages.dev` (Proxied)
  - `CNAME` | `www` | `climamedix.pages.dev` (Proxied)
- **SSL Certificate**: Auto-provisioned by Cloudflare (Google Trust Services).

---

## 3. Inbound Email Setup (Cloudflare Email Routing)

Cloudflare Email Routing acts as a free MX proxy that catches all incoming mail and forwards it to the Gmail inbox.

### Step 1: DNS Records in Cloudflare
The old default Namecheap MX records (`eforward1` through `eforward5`) were deleted, and Cloudflare's mail exchange records were added:

| Type | Host | Content | Priority |
| :--- | :--- | :--- | :--- |
| **MX** | `@` | `route1.mx.cloudflare.net` | `30` |
| **MX** | `@` | `route2.mx.cloudflare.net` | `86` |
| **MX** | `@` | `route3.mx.cloudflare.net` | `99` |
| **TXT** (DKIM) | `cf2024-1._domainkey` | `v=DKIM1; k=rsa; p=...` | — |

### Step 2: Verified Destination & Catch-All Rule
1. **Destination Address**: `climamedix@gmail.com` (verified via confirmation email).
2. **Catch-All Rule**:
   - **Matcher**: `all` (Catches any address: `contact@`, `info@`, `support@`, etc.)
   - **Action**: Forward to `climamedix@gmail.com`
   - **Status**: Enabled & Active.

---

## 4. Outbound Email Setup (Send Mail As via Gmail SMTP)

Allows the client to compose and reply directly as `contact@climamedix.org` inside `climamedix@gmail.com`.

### Step 1: Unified SPF Record (Cloudflare DNS)
To ensure sent emails pass SPF checks and never land in spam/junk folders, a combined SPF TXT record was configured:
- **Type**: `TXT`
- **Host**: `@`
- **Content**:
  ```text
  v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
  ```
  *(Includes `_spf.mx.cloudflare.net` for Cloudflare routing and `_spf.google.com` for Google SMTP delivery).*

### Step 2: Google App Password
Because Google disables legacy passwords and hides App Passwords when 2-Step Verification is off:
1. Enabled **2-Step Verification** on `climamedix@gmail.com`.
2. Generated a dedicated 16-letter **App Password** named `ClimaMedix`.

### Step 3: Gmail "Send mail as" Configuration
Configured in **Gmail Settings** $\rightarrow$ **Accounts and Import** $\rightarrow$ **Send mail as**:
- **Name**: `Clima Medix`
- **Email Address**: `contact@climamedix.org`
- **Treat as an alias**: Checked
- **SMTP Server**: `smtp.gmail.com`
- **Port**: `587`
- **Username**: `climamedix@gmail.com`
- **Password**: `[16-letter App Password]`
- **Connection**: TLS (Secured)
- Verified via confirmation code sent to `contact@climamedix.org`.

---

## 5. Verification & Live Status Check

| Component | Status | Details |
| :--- | :--- | :--- |
| **Web (HTTPS)** | 🟢 Active | `https://climamedix.org` loads the PWA via Cloudflare edge. |
| **Nameservers** | 🟢 Propagated | Pointed to `hans` and `jule.ns.cloudflare.com`. |
| **Inbound Mail** | 🟢 Ready | Catch-all forwarding to `climamedix@gmail.com`. |
| **Outbound Mail** | 🟢 Authenticated | Sending through Google SMTP with SPF + DKIM compliance. |

---

## 6. Supabase Auth Notice
Ensure the following redirect URLs are present in **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **URL Configuration**:
- `https://climamedix.org/**`
- `https://www.climamedix.org/**`
