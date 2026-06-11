# QuickBill — SaaS Invoice Generator

A full-stack SaaS application for creating, managing, and sending professional invoices. Built with the MERN stack and deployed on Render & Vercel.

**Live Demo:** 
[https://quickbill-nine.vercel.app](https://quickbill-nine.vercel.app)

---

## 🚀 Features

- **Authentication** — JWT-based login/register with protected routes
- **Client Management** — Add, edit, delete clients
- **Invoice Builder** — Dynamic line items with auto-calculated totals, tax, and subtotal
- **PDF Generation** — Download professional invoices as PDFs (Puppeteer)
- **Email Invoices** — Send invoices directly to clients via email (Nodemailer)
- **Status Tracking** — Draft → Sent → Paid workflow
- **SaaS Pricing Tiers** — Free (5 invoices/month + watermark) vs Pro (unlimited)
- **Stripe Integration** — Checkout session for Pro subscription (test mode)
- **Responsive UI** — Built with Tailwind CSS

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Auth** | JWT, bcryptjs |
| **PDF** | Puppeteer |
| **Email** | Nodemailer |
| **Payments** | Stripe (test mode) |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## 📸 Screenshots
<img width="961" height="890" alt="image" src="https://github.com/user-attachments/assets/ecd0d867-0331-44b9-a533-36f0006f8c1a" />
<img width="947" height="897" alt="image" src="https://github.com/user-attachments/assets/39289418-7c22-440b-80dc-87a4509c901f" />
<img width="947" height="887" alt="Screenshot 2026-06-12 035520" src="https://github.com/user-attachments/assets/6e639a6f-08c0-499b-bcf7-e9e35dba009e" />
<img width="952" height="887" alt="image" src="https://github.com/user-attachments/assets/91b578a4-6ed4-4877-9acf-92b2c93da3e2" />
<img width="947" height="972" alt="image" src="https://github.com/user-attachments/assets/a3925f5e-1d5e-4c12-b78c-4748b417e4b5" />








---

## ⚙️ Installation

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- Stripe account (optional, for payments)

### 1. Clone the repository
```bash
git clone https://github.com/Divyansh-Meena/QuickBill.git
cd QuickBill
