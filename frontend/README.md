# Personal Productivity Frontend

A modern, responsive personal productivity platform built with Next.js 15, Better Auth, and Tailwind CSS with a clean, professional design focused on enhancing user productivity.

## 🚀 Features

- **Secure Authentication**

  - Email/password registration and login
  - Email OTP verification
  - Password reset with OTP
  - Social authentication (Google, Apple)
  - Two-factor authentication
  - Session management

- **Productivity Tools**

  - Task management and organization
  - Goal setting and tracking
  - Progress visualization
  - Productivity analytics
  - Smart scheduling

- **Beautiful UI/UX**

  - Modern productivity-focused design
  - Responsive design (mobile-first)
  - Clean, minimal interface
  - Smooth transitions and loading states
  - Accessible design (WCAG AA compliant)

- **Developer Experience**
  - TypeScript throughout
  - Form validation with Zod + React Hook Form
  - Reusable UI components
  - Tailwind CSS for styling
  - ESLint + Prettier configured

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## 📱 Pages & Flows

### Application Pages

- `/` - Landing page showcasing productivity features
- `/signup` - User registration
- `/login` - User sign in
- `/verify-email` - Email verification with OTP
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset with OTP
- `/dashboard` - Personal productivity dashboard
- `/profile` - User profile and settings

### Authentication Flows

#### Sign Up Flow

```
Landing → Sign Up → Email Verification → Dashboard
```

#### Sign In Flow

```
Landing → Sign In → Dashboard
```

#### Password Reset Flow

```
Sign In → Forgot Password → Reset Password → Sign In → Dashboard
```

## 🎨 Design System

The design follows a clean, productivity-focused aesthetic with:

- **Colors**: Blue/purple gradients with neutral grays for focus
- **Typography**: System fonts with clear hierarchy for readability
- **Components**: Consistent spacing and styling optimized for productivity
- **Layout**: Dashboard-focused design with intuitive navigation

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for detailed design guidelines.

## 🚦 Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp env.example .env
   ```

   Update `.env` with your backend URL:

   ```
   NEXT_PUBLIC_AUTH_URL=http://localhost:3002
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── login/             # Sign in page
│   ├── signup/            # Registration page
│   ├── verify-email/      # Email verification
│   ├── forgot-password/   # Password reset request
│   ├── reset-password/    # Password reset form
│   ├── dashboard/         # Protected dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   ├── auth-layout.tsx   # Authentication page layout
│   ├── social-auth-buttons.tsx # Social login buttons
│   └── ui/               # UI components
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       └── spinner.tsx
├── lib/                  # Utilities and configuration
│   ├── auth-client.ts   # Better Auth client setup
│   ├── permissions.ts   # Permission definitions
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

## 🔧 Configuration

### Better Auth Client

The auth client is configured in `lib/auth-client.ts` with:

- Email OTP plugin for verification
- Organization plugin for multi-tenant support
- Proper CORS configuration for backend communication

### Tailwind CSS

Custom configuration in `tailwind.config.js` with:

- Extended color palette
- Custom font family
- Responsive breakpoints

## 🎯 Key Components

### AuthLayout

Provides the split-screen layout with:

- Left side: Gradient background with branding
- Right side: Authentication forms
- Responsive behavior (mobile hides left side)

### SocialAuthButtons

Reusable social authentication buttons with:

- Google OAuth integration
- Apple sign-in placeholder
- Dynamic text based on context (sign up vs sign in)

### Form Components

Type-safe form handling with:

- Zod schema validation
- React Hook Form integration
- Consistent error handling
- Loading states

## 🔒 Security Features

- CSRF protection via Better Auth
- Secure session management
- Email verification required
- Password strength validation
- Rate limiting on sensitive endpoints

## 📱 Responsive Design

- **Mobile (< 768px)**: Single column, simplified layout
- **Tablet (768px - 1024px)**: Balanced layout
- **Desktop (> 1024px)**: Full split-screen experience

## 🚀 Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🤝 API Integration

The frontend integrates with the backend API documented in `../backend/working-api.md`:

- Authentication endpoints (`/api/auth/*`)
- Email OTP endpoints (`/api/auth/email-otp/*`)
- Organization endpoints (`/api/auth/organization/*`)
- Health check endpoints (`/health`)

## 📝 Environment Variables

```bash
# Backend API URL
NEXT_PUBLIC_AUTH_URL=http://localhost:3002

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

## 🧪 Testing

The application has been tested with:

- ✅ User registration flow
- ✅ Email verification
- ✅ Sign in/out functionality
- ✅ Password reset flow
- ✅ Responsive design
- ✅ Form validation
- ✅ Error handling

## 🎨 Customization

To customize the design:

1. **Colors**: Update `tailwind.config.js` and component classes
2. **Branding**: Modify `AuthLayout` component
3. **Typography**: Update font family in `globals.css`
4. **Layout**: Adjust responsive breakpoints in components

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://better-auth.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hook Form Documentation](https://react-hook-form.com)

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured for `http://localhost:3000`
2. **Auth Client Errors**: Check `NEXT_PUBLIC_AUTH_URL` environment variable
3. **Styling Issues**: Ensure Tailwind CSS is properly configured
4. **TypeScript Errors**: Run `npm run build` to check for type issues

### Debug Mode

Enable debug logging by setting:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will log authentication events to the browser console.

---

**Built with ❤️ to boost your productivity using Next.js, Better Auth, and Tailwind CSS**
