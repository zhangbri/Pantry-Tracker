# 🛒 PantryMate ⚖️

## 🌟 Introduction
Welcome to the Pantry Tracker project repository! 🚀 This repository contains the codebase for a platform designed to help users efficiently manage their pantry. With real-time inventory tracking and AI-powered object classification from images, the site simplifies kitchen organization, offering a user-friendly and intuitive experience. Whether you're managing your personal kitchen or a larger inventory, this platform ensures you stay organized and never run out of essentials.

## 💡 Features
- **Real-Time Inventory Management:** 📊 Automatically tracks and updates your pantry inventory, helping you stay organized.
- **User Authentication:** 🔑 Secure login functionality to manage personal pantry items privately.
- **Intuitive Interface:** 🧭 A clean, easy-to-navigate dashboard for adding, editing, and removing pantry items.
- **Interactive Elements:** 💥 Dynamic UI elements for a seamless user experience.
- **AI-Powered Image Capture:** 📸 Easily capture images of pantry items and let AI classification automatically add them to your inventory list.

## 🛠️ Technologies 
- **HTML:** 📝 Provides structure to the website's clean and interactive pages.
- **CSS:** 🎨 Styles the platform for a sleek, modern design, including responsive features.
- **JavaScript:** ⚙️ Powers the interactive features and real-time inventory updates.
- **Next.js:** ⚡ Ensures fast server-side rendering for optimized performance.
- **Firebase:** 🔥 Manages user authentication and database storage for secure and efficient data handling.

## 🚀 Installation and Setup
**Clone the repository**
```
git clone https://github.com/zhangbri/Pantry-Tracker.git
```
**Navigate to the project folder**
```
cd Pantry-Tracker
```
**Install dependencies**
```
npm install
```
**Create a .env.local file**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```
**Start the development server**
```
npm run dev
```
**Open** http://localhost:3000 **in your web browser to view the app.**

## Live Demo 🔗
My Website: https://pantrymate.vercel.app/

## 📁 Directory Structure
- `ImageCapture.js` - React component for capturing images using the device's - camera.
- `globals.css` - Global styles for the website, including custom fonts and responsive design.
- `layout.js` - Defines the page layout and includes meta tags for SEO and Google Analytics.
- `page.js` - Main page for displaying and managing the pantry inventory, with interactive elements.

## 📸 Screenshots
<p align="center">
  <img width="49.7%" alt="HomeScreen" src="https://github.com/zhangbri/Pantry-Tracker/blob/main/PantryMate.png">
  <img width="49.7%" alt="Pantry List" src="https://github.com/zhangbri/Pantry-Tracker/blob/main/PantryList.png">
</p>
<p align="center">
  <img width="50%" alt="Image Capture" src="https://github.com/zhangbri/Pantry-Tracker/blob/main/ImageCapture.png">
</p>

## 📬 Contact
Have any questions or suggestions? Feel free to reach out via email at [zhangbri@umich.edu](mailto:zhangbri@umich.edu), or connect with me on [LinkedIn](https://www.linkedin.com/in/zhangbri/). I'm open to discussions, collaborations, and feedback.
