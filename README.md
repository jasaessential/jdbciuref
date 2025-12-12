
# Jasa Essentials - In-Depth Project Architecture

Welcome to your Next.js application! This document provides a comprehensive, file-by-file overview of the project's architecture to help you navigate, understand, and build upon the codebase.

## High-Level Overview

This is a modern, full-stack e-commerce and management application built on the Next.js App Router. It leverages a powerful tech stack including:
- **Framework**: Next.js with React (TypeScript)
- **Styling**: Tailwind CSS with ShadCN UI components
- **Backend**: Firebase (Firestore for database, Authentication for users)
- **External Services**: Cloudinary for image hosting, Google Drive for document storage.

---

## Deployment to Netlify

For the live application to function correctly on Netlify, you must configure your environment variables and authorize your domain in Google Cloud. These are secrets (like API keys) and permissions that are not stored in the code for security reasons.

### Part 1: Add Environment Variables on Netlify

1.  Log in to your **Netlify account**.
2.  Go to your site's dashboard.
3.  Navigate to **Site configuration** > **Build & deploy** > **Environment**.
4.  Under **Environment variables**, click **Edit variables**.
5.  Add each of the following variables one by one. Copy the names and values exactly from your local `.env.local` file.

**Required Variables:**
- **Google Drive API:**
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
  - `GOOGLE_REFRESH_TOKEN`
  - `GOOGLE_FOLDER_ID`
- **Cloudinary:**
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- **Firebase:**
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### Part 2: Authorize Your Domain in Google Cloud

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Select the project that matches your `GOOGLE_CLIENT_ID`.
3.  In the navigation menu (☰), go to **APIs & Services** > **Credentials**.
4.  Under **OAuth 2.0 Client IDs**, find your client ID and click the pencil icon (✏️) to edit it.
5.  Under **Authorized JavaScript origins**, click **+ ADD URI**.
6.  Enter the URL of your live Netlify site (e.g., `https://your-site-name.netlify.app`).
7.  Click **Save**.

### Part 3: Re-deploy on Netlify

After completing both parts, you must **re-deploy your site** for the changes to take effect.
1.  Go to the **Deploys** tab in your Netlify dashboard.
2.  Click the **Trigger deploy** dropdown and select **Deploy site**.

---

## Root Directory: Configuration Files

These files configure the core behavior of the application, its dependencies, and deployment settings.

- **`next.config.ts`**: The main configuration file for Next.js. Here, you'll find settings for image optimization (`remotePatterns` to allow images from specific domains like Cloudinary), build process adjustments (like ignoring TypeScript/ESLint errors during builds), and custom headers for caching.

- **`tailwind.config.ts`**: The configuration file for Tailwind CSS. It defines the application's design system, including fonts (`Poppins`, `PT Sans`), colors (via CSS variables for theming), and custom animations.

- **`tsconfig.json`**: The TypeScript configuration file. It sets the compiler options and rules, such as path aliases (e.g., `@/*` pointing to `src/*`) which make imports cleaner.

- **`package.json`**: Lists all project dependencies (`dependencies`) and development tools (`devDependencies`). It also defines the main `scripts` for running the app (`dev`), building it for production (`build`), and starting the production server (`start`).

- **`components.json`**: The configuration file for ShadCN UI. It tells the ShadCN CLI where to find your UI components, how they should be styled, and what aliases to use.

- **`apphosting.yaml`**: Configuration for Firebase App Hosting. It controls server-side settings, such as the maximum number of server instances to handle traffic.

- **`firestore.rules`**: Defines the security rules for your Cloud Firestore database. This crucial file specifies who can read, write, update, or delete data in each collection, ensuring your data is secure. For example, it allows users to read their own profile but lets admins read/write any profile.

---

## `src` Directory: Application Source Code

This directory contains all of the application's source code, organized by function.

### `src/app`
This directory implements the **Next.js App Router**, where folder names define URL routes.

- **`layout.tsx`**: The root layout for the entire application. It sets up the main `<html>` and `<body>` structure, includes global styles (`globals.css`), fonts, and wraps all pages with essential **Context Providers** from `src/components/providers.tsx`.
- **`globals.css`**: The global stylesheet. It contains Tailwind CSS directives and is where ShadCN's CSS variables for theming (light/dark mode colors) are defined.
- **`page.tsx`**: The component for the homepage, accessible at the `/` route.
- **`api/`**: Contains server-side API route handlers. For example, `api/upload/route.ts` provides an endpoint to handle file uploads to Google Drive.
- **Route Folders (`[folderName]/page.tsx`)**: Each folder with a `page.tsx` file creates a new public route.
    - `app/cart/page.tsx` renders the `/cart` page.
    - `app/product/[id]/page.tsx` is a dynamic route for product details, like `/product/123`.
- **`admin/`**: This folder group contains pages accessible only to administrators. Access control is enforced within each page component by checking the user's role from the `useAuth` hook.
    - `admin/manage-products/page.tsx` is the dashboard for creating, editing, and deleting products.
    - `admin/manage-users/page.tsx` is where admins can change user roles and permissions.
- **`seller/`**: This group contains pages specifically for users with the "seller" role.
    - `seller-dashboard/page.tsx` is the main dashboard for sellers to view their assigned shops.
- **`actions/`**: Holds Next.js Server Actions. These are server-side functions that can be called directly from client components (e.g., from a form `onSubmit` handler), eliminating the need for separate API endpoints for data mutations.
    - `drive-actions.ts` contains functions for interacting with Google Drive (fetching usage, listing files, deleting files).
    - `upload-image-action.ts` handles uploading base64-encoded images to Cloudinary.

### `src/components`
This directory holds all reusable React components.

- **`ui/`**: Contains the pre-built UI components provided by ShadCN (e.g., `Button`, `Card`, `Dialog`, `Input`). These are the foundational building blocks for the application's UI.
- **`app-sidebar.tsx`**: The main sidebar navigation component, which dynamically shows links based on the user's role (admin, seller, etc.).
- **`auth-form.tsx`**: The component for handling user login and registration, including email/password and Google sign-in methods.
- **`product-card.tsx`**: A reusable card component to display product information, including image, name, price, and an "Add to Cart" button.
- **`header.tsx`**: The application's main header, containing navigation, user actions, and the cart link.
- **`checkout-form.tsx`**: The core form component used across all checkout pages, handling address selection, seller selection, and order summary.

### `src/context`
This directory contains React Context providers for managing global state.

- **`auth-provider.tsx`**: Manages the current user's authentication state, profile data (including roles), and performs data migrations for the user object if needed. It listens for auth changes from Firebase and fetches the corresponding user profile from Firestore.
- **`cart-provider.tsx`**: Manages the shopping cart's state (items, quantities) and persists it to the browser's `localStorage`.
- **`theme-provider.tsx`**: Manages the application's light/dark theme and persists the choice to `localStorage`.
- **`location-provider.tsx`**: Manages the user's selected delivery location and persists it.
- **`loading-provider.tsx`**: Manages a global loading state to show/hide a full-screen loading spinner during long operations.

### `src/hooks`
This directory contains custom React hooks that provide easy access to the contexts defined in `src/context`, simplifying state management in components.

- **`useAuth.ts`**, **`useCart.ts`**, **`useTheme.ts`**, **`useLocation.ts`**, **`useLoading.ts`**: Each of these hooks provides a clean interface to its corresponding context (e.g., `const { user } = useAuth();`).
- **`use-debounce.ts`**: A utility hook to delay the execution of a function. This is used in the homepage search bar to prevent making a search request on every keystroke.
- **`use-mobile.ts`**: A hook to detect if the application is being viewed on a mobile-sized screen, used for responsive UI adjustments.

### `src/lib`
This is the core logic directory of the application.

- **`firebase.ts`**: Initializes and exports the core Firebase services (`app`, `auth`, `db`) for use throughout the application.
- **`data.ts`**: Contains the primary functions for interacting with the Firestore database to **C**reate, **R**ead, **U**pdate, and **D**elete (CRUD) application data like products, brands, and authors.
- **`users.ts`**, **`shops.ts`**, **`posts.ts`**: Similar to `data.ts`, but organized by data type to handle user, shop, and post-specific database interactions, making the codebase easier to manage.
- **`cloudinary.ts`**, **`googleDrive.ts`**: Contain functions for interacting with external services—Cloudinary for image management and Google Drive for file storage.
- **`types.ts`**: Defines all the core TypeScript types and interfaces used throughout the application (e.g., `Product`, `UserProfile`, `Shop`, `Order`). This is central to maintaining type safety.
- **`utils.ts`**: A utility file containing helper functions. Its most notable export is the `cn` function from `tailwind-merge`, used for conditionally combining CSS classes.
- **`pincode-data.ts`**: A local data file containing a list of serviceable pincodes for the Namakkal and Salem districts, used by the location selector.
- **`pincodes.ts`**: Contains server-side functions for interacting with the `pincodes` and `pincodeRequests` collections in Firestore.
