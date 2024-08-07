'use client'
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, Typography, Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { collection, deleteDoc, doc, query, getDoc, getDocs, setDoc } from "firebase/firestore";
import ImageCapture from '../app/ImageCapture.js'; 
import SEO from '../components/SEO'
import { auth, firestore } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";

import addIcon from '../images/Add.png';
import removeIcon from '../images/Minus.png';
import Trash from '../images/x.png';
import backgroundImage from '../images/background.png';
import numeric from '../images/numeric.png';
import revnumeric from '../images/revnumeric.png';
import alpha from '../images/alphabetical.png';
import revalpha from '../images/revalpha.png';
import logo from '../images/logo.png';

const theme = createTheme({
  typography: {
    fontFamily: 'Arial',
  },
  components: {
    MuiInput: {
      styleOverrides: {
        root: {
          '&:before': {
            borderBottom: 'none',
          },
          '&:after': {
            borderBottom: 'none',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: 'none',
          },
        },
        input: {
          textAlign: 'center',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: '#A47FC4',
          color: 'white',
          '&:hover': {
            backgroundColor: '#85B45C',
          },
          textTransform: 'capitalize',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'black',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'black',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'black',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          minHeight: '240px',
          minWidth: '500px',
          display: 'flex',
          flexDirection: 'column',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        },
      },
    },
  },
});

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [originalInventory, setOriginalInventory] = useState([]);
  const [boxSize, setBoxSize] = useState({ width: Math.max(800, 520), height: '85vh' });
  const resizeRef = useRef(null);
  const [listName, setListName] = useState('My List');
  const [isEditingListName, setIsEditingListName] = useState(false);
  const listNameInputRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sortType, setSortType] = useState('reverseNumeric');
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraMode, setCameraMode] = useState('initial');
  const [newItemPlaceholder, setNewItemPlaceholder] = useState("Enter New Item");
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search Items");
  const [user, loading] = useAuthState(auth);
  const [customLists, setCustomLists] = useState([]);
  const [currentList, setCurrentList] = useState('default');
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const [isLogInDialogOpen, setIsLogInDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');  
  const imageCaptureRef = useRef(null);
  const [signUpError, setSignUpError] = useState('');
  const [logInError, setLogInError] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  const updateInventory = async () => {
    try {
      if (user) {
        const snapshot = query(collection(firestore, `users/${user.uid}/inventory`));
        const docs = await getDocs(snapshot);
        const inventoryList = docs.docs.map(doc => ({
          id: doc.id,
          name: doc.id,
          ...doc.data(),
        }));
        setInventory(inventoryList);
        setOriginalInventory(inventoryList);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    }
  };

  const removeItem = async (item) => {
    if (user) {
      try {
        const docRef = doc(firestore, `users/${user.uid}/inventory`, item);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentQuantity = docSnap.data().quantity;
          const newQuantity = Math.max(0, currentQuantity - 1);
          await setDoc(docRef, { quantity: newQuantity }, { merge: true });
        }
        await fetchInventoryFromFirebase();
      } catch (error) {
        console.error("Error updating item quantity in Firebase:", error);
      }
    } else {
      setInventory(prevInventory => {
        const updatedInventory = prevInventory.map(i => 
          i.name === item ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i
        );
        setOriginalInventory(updatedInventory);
        return updatedInventory;
      });
    }
  };

  const addItem = async (itemName) => {
    if (itemName.trim() === '') return;

    if (user) {
      try {
        const docRef = doc(firestore, `users/${user.uid}/inventory`, itemName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await setDoc(docRef, { quantity: docSnap.data().quantity + 1 }, { merge: true });
        } else {
          await setDoc(docRef, { quantity: 1 });
        }
        await fetchInventoryFromFirebase();
      } catch (error) {
        console.error("Error adding item to Firebase:", error);
      }
    } else {
      setInventory(prevInventory => {
        const existingItemIndex = prevInventory.findIndex(item => item.name === itemName);
        let updatedInventory;
        if (existingItemIndex !== -1) {
          updatedInventory = prevInventory.map((item, index) => 
            index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          updatedInventory = [...prevInventory, { id: itemName, name: itemName, quantity: 1 }];
        }
        setOriginalInventory(updatedInventory);
        return updatedInventory;
      });
    }

    setNewItemName('');
    setNewItemPlaceholder("Enter New Item");
  };


  const handleItemEdit = async (index, field, value) => {
    if (user) {
      try {
        const item = inventory[index];
        if (field === 'name' && item.name !== value) {
          await deleteDoc(doc(firestore, `users/${user.uid}/inventory`, item.name));
          await setDoc(doc(firestore, `users/${user.uid}/inventory`, value), { quantity: item.quantity });
        } else if (field === 'quantity') {
          const newQuantity = Math.max(0, parseInt(value) || 0);
          await setDoc(doc(firestore, `users/${user.uid}/inventory`, item.name), { quantity: newQuantity }, { merge: true });
        }
        await fetchInventoryFromFirebase();
      } catch (error) {
        console.error("Error updating item in Firebase:", error);
      }
    } else {
      setInventory(newInventory);
      setOriginalInventory(newInventory);
    }
  };


  const handleItemSubmit = async (index) => {
    const item = inventory[index];
    if (item.id !== item.name) {
      await setDoc(doc(collection(firestore, 'inventory'), item.name), { quantity: item.quantity });
      await deleteDoc(doc(collection(firestore, 'inventory'), item.id));
    } else {
      await setDoc(doc(collection(firestore, 'inventory'), item.id), { quantity: item.quantity });
    }
    await updateInventory();
  };

  useEffect(() => {
    if (user) {
      fetchInventoryFromFirebase();
      fetchListNameFromFirebase();
    } else {
      setInventory([]);
      setOriginalInventory([]);
      setListName('My List');
    }
  }, [user]);

  const fetchListNameFromFirebase = async () => {
    if (user) {
      try {
        const docRef = doc(firestore, `users/${user.uid}/settings`, 'listName');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setListName(docSnap.data().name);
        } else {
          await setDoc(docRef, { name: 'My List' });
          setListName('My List');
        }
      } catch (error) {
        console.error("Error fetching list name:", error);
      }
    }
  };

  const fetchInventoryFromFirebase = async () => {
    if (user) {
      try {
        const snapshot = await getDocs(collection(firestore, `users/${user.uid}/inventory`));
        const inventoryList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.id,
          quantity: doc.data().quantity,
        }));
        setInventory(inventoryList);
        setOriginalInventory(inventoryList);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isResizing && resizeRef.current) {
      const newWidth = Math.max(e.clientX - resizeRef.current.getBoundingClientRect().left, 520);
      const newHeight = e.clientY - resizeRef.current.getBoundingClientRect().top;
      setBoxSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleListNameEdit = () => {
    setIsEditingListName(true);
  };

  const handleListNameChange = (event) => {
    setListName(event.target.value);
  };

  const handleListNameSubmit = async () => {
    setIsEditingListName(false);
    if (user) {
      try {
        const docRef = doc(firestore, `users/${user.uid}/settings`, 'listName');
        await setDoc(docRef, { name: listName });
        console.log("List name saved successfully");
      } catch (error) {
        console.error("Error saving list name:", error);
      }
    } else {
      localStorage.setItem('listName', listName);
    }
  };

  const deleteItem = async (item) => {
    if (user) {
      try {
        await deleteDoc(doc(firestore, `users/${user.uid}/inventory`, item));
        await fetchInventoryFromFirebase();
      } catch (error) {
        console.error("Error deleting item from Firebase:", error);
      }
    } else {
      setInventory(prevInventory => {
        const updatedInventory = prevInventory.filter(i => i.name !== item);
        setOriginalInventory(updatedInventory);
        return updatedInventory;
      });
    }
  };

  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setInventory(originalInventory);
    } else {
      const filteredInventory = originalInventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setInventory(filteredInventory);
    }
  };
  
  const handleSort = () => {
    let sortedInventory = [...inventory];
    switch (sortType) {
      case 'reverseNumeric':
        sortedInventory.sort((a, b) => b.quantity - a.quantity);
        setSortType('numeric');
        break;
      case 'numeric':
        sortedInventory.sort((a, b) => a.quantity - b.quantity);
        setSortType('alphabetical');
        break;
      case 'alphabetical':
        sortedInventory.sort((a, b) => a.name.localeCompare(b.name));
        setSortType('reverseAlphabetical');
        break;
      case 'reverseAlphabetical':
        sortedInventory.sort((a, b) => b.name.localeCompare(a.name));
        setSortType('reverseNumeric');
        break;
    }
    setInventory(sortedInventory);
  };

  const getSortButtonContent = () => {
    switch (sortType) {
      case 'reverseNumeric':
        return (
          <>
            <span>sort:</span>
            <Image src={revnumeric} alt="Reverse Numeric" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
      case 'numeric':
        return (
          <>
            <span>sort:</span>
            <Image src={numeric} alt="Numeric" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
      case 'alphabetical':
        return (
          <>
            <span>sort:</span>
            <Image src={alpha} alt="Alphabetical" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
      case 'reverseAlphabetical':
        return (
          <>
            <span>sort:</span>
            <Image src={revalpha} alt="Reverse Alphabetical" width={20} height={20} style={{ marginLeft: '2px' }} />
          </>
        );
    }
  };

  const handleReset = () => {
    setInventory(originalInventory);
    setSearchTerm('');
    setSearchPlaceholder("Search Items");
  };

  const handleTakePhoto = () => {
    setCameraMode('capture');
  };
  
  const handleCapturePhoto = (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
    setCameraMode('preview');
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setCameraMode('capture');
  };

  const handleDone = () => {
    setCameraMode('initial');
    setCapturedImage(null);
  };

  const handleUploadPhoto = async () => {
    if (!capturedImage) return;
  
    try {
      const response = await fetch('/api/classifyImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: capturedImage.split(',')[1] }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log('Classification data:', data);
        const classification = data.classification;
        
        await addItem(classification);
        
        setInventory(prevInventory => {
          const existingItem = prevInventory.find(item => item.name === classification);
          if (existingItem) {
            return prevInventory.map(item => 
              item.name === classification ? { ...item, quantity: item.quantity } : item
            );
          } else {
            return [...prevInventory, { id: classification, name: classification, quantity: 1 }];
          }
        });
      } else {
        console.error('Image classification failed:', data.error);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleNewItemFocus = () => {
    setNewItemPlaceholder("");
  };

  const handleNewItemBlur = () => {
    if (newItemName === "") {
      setNewItemPlaceholder("Enter New Item");
    }
  };

  const handleSearchFocus = () => {
    setSearchPlaceholder("");
  };

  const handleSearchBlur = () => {
    if (searchTerm === "") {
      setSearchPlaceholder("Search Items");
    }
  };

  const handleSignInClick = () => {
    setSignUpError('');
    setIsSignInDialogOpen(true);
  };

  const handleLogInClick = () => {
    setLogInError('');
    setIsLogInDialogOpen(true);
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      setInventory([]);
      setOriginalInventory([]);
      setListName('My List');
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSignIn = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsSignInDialogOpen(false);
      resetAuthFields();
    } catch (error) {
      console.error("Error signing up:", error);
      if (error.code === 'auth/email-already-in-use') {
        setSignUpError('This email is already registered. Please use a different email or try logging in.');
      } else if (error.code === 'auth/weak-password') {
        setSignUpError('Your password is too weak. Please choose a stronger password.');
      } else {
        setSignUpError('Please enter a valid email and password.');
      }
    }
  };

  const handleLogIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsLogInDialogOpen(false);
      resetAuthFields();
    } catch (error) {
      console.error("Error logging in:", error);
      if (error.code === 'auth/user-not-found') {
        setLogInError('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setLogInError('Your password is incorrect, please try again.');
      } else {
        setLogInError('Please enter a valid email and password.');
      }
    }
  };

  const handleCameraFlip = () => {
    setIsFrontCamera(prev => !prev);
  };

  const handleAddItemKeyPress = (event) => {
    if (event.key === 'Enter') {
      addItem(newItemName);
    }
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleForgotPasswordClick = () => {
    resetAuthFields();
    setIsLogInDialogOpen(false);
    setIsForgotPasswordDialogOpen(true);
  };
  
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail);
      setIsForgotPasswordDialogOpen(false);
      resetAuthFields();
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setForgotPasswordError('No account found with this email address.');
    }
  };

  const resetAuthFields = () => {
    setEmail('');
    setPassword('');
    setForgotPasswordEmail('');
    setSignUpError('');
    setLogInError('');
    setForgotPasswordError('');
  };

  const handleKeyPress = (event, action) => {
    if (event.key === 'Enter') {
      action();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <>
        <SEO 
          title="PantryMate - Home"
          description="Manage your pantry inventory with ease using PantryMate."
          canonicalUrl="https://www.pantrymate.vercel.app"
        />
      <Box
        width="100%"
        minHeight="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        pt={1}
        gap={2}
        sx={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
      <Box position="absolute" left="0px" top="-25px">
        <Image
          src={logo}
          alt="PantryMate Logo"
          width={175} 
          height={175}  
        />
      </Box>
      <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          width={boxSize.width}
          position="relative"
        >
        <Box 
            onClick={handleListNameEdit} 
            sx={{ 
              cursor: 'text', 
              mb: 2,
              position: 'relative',
              width: '100%',
            }}
          >
          <input
            ref={listNameInputRef}
            value={listName}
            onChange={handleListNameChange}
            onBlur={handleListNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleListNameSubmit();
              }
            }}
            style={{
              fontFamily: 'Pacifico, cursive',
              fontSize: '3rem',
              textAlign: 'center',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              cursor: 'text',
            }}
            readOnly={!isEditingListName}
          />
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" width="99%" mb={1}>
          <TextField
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={handleAddItemKeyPress}
            placeholder={newItemPlaceholder}
            variant="outlined"
            size="small"
            onFocus={handleNewItemFocus}
            onBlur={handleNewItemBlur}
            sx={{ 
              width: '30%',
              '& input::placeholder': {
                color: 'black',
                opacity: 1,
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={() => addItem(newItemName)}
          >
            Add
          </Button>
          <TextField
            value={searchTerm}
            onChange={(e) => {setSearchTerm(e.target.value), handleSearch();}}
            onKeyPress={handleSearchKeyPress}
            placeholder={searchPlaceholder}
            variant="outlined"
            size="small"
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            sx={{ 
              width: '27%',
              '& input::placeholder': {
                color: 'black',
                opacity: 1,
              },
            }}
          />
          <Button 
            variant="contained" 
            onClick={handleSearch}
            >
              Search
          </Button>
          <Button 
            variant="contained" 
            onClick={handleReset}
            >
              Reset
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSort}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {getSortButtonContent()}
          </Button>
        </Box>
      <Box
        ref={resizeRef} 
        border="6px solid #7FC2C4"
        borderRadius="15px" 
        overflow="hidden" 
        width={boxSize.width}
        height={boxSize.height}
        display="flex"
        flexDirection="column"
        position="relative"
        style={{ resize: 'both', overflow: 'auto' }}
        sx={{
          minWidth: '520px',
          resize: 'both',
          overflow: 'auto'
        }}
      >
      <Box
        width="100%"
        height="80px"
        bgcolor="#7FC2C4"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h3" color="black" textAlign="center">
            Items
          </Typography>
        </Box>
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h3" color="black" textAlign="center">
            Quantity
          </Typography>
        </Box>
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h3" color="black" textAlign="center">
            Actions
          </Typography>
        </Box>
      </Box>
      <Stack 
        width="100%" 
        height="100%" 
        spacing={0} 
        overflow="auto"
        className="hide-scrollbar"
      >
        {inventory.map(({id, name, quantity,}, index) => (
          <Box 
            key={id}
            width="100%"
            minHeight="80px"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            sx={{
              position: 'relative',
              '&:hover': {
                backgroundColor: '#C4827F',
              },
              borderBottom: '6px solid #7FC2C4',
            }}
            position="relative"
          >
          <Box
            position="absolute"
            left={0}
            top={0}
            bottom={0}
            width="10%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ 
              zIndex: 1,
            }}
          >
            {hoveredIndex === index && (
              <Image
                src={Trash}
                alt="Delete Item"
                style={{ cursor: 'pointer', width: '30px', height: '30px' }}
                onClick={() => deleteItem(name)}
              />
            )}
          </Box>
          <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <TextField
                value={name}
                onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                onBlur={() => handleItemSubmit(index)}
                variant="standard"
                inputProps={{ style: { fontSize: '2rem', textAlign: 'center' } }}
              />
            </Box>
            <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <TextField
                value={quantity}
                onChange={(e) => handleItemEdit(index, 'quantity', e.target.value)}
                onBlur={() => handleItemSubmit(index)}
                variant="standard"
                InputProps={{ 
                  style: { fontSize: '2rem', textAlign: 'center' },
                  inputProps: { min: 0 } 
                }}
              />
            </Box>
            <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <Stack direction="row" spacing={5} justifyContent="center">
                <Image
                  src={addIcon}
                  alt="Add Item"
                  style={{ cursor: 'pointer', width: '40px', height: '40px' }}
                  onClick={() => addItem(name)}
                />
                <Image
                  src={removeIcon}
                  alt="Remove Item"
                  style={{ 
                    cursor: quantity > 0 ? 'pointer' : 'not-allowed', 
                    width: '40px', 
                    height: '40px',
                    opacity: quantity > 0 ? 1 : 0.5 
                  }}
                  onClick={() => quantity > 0 && removeItem(name)}
                />
              </Stack>
            </Box>
          </Box>
        ))}
      </Stack>
      <Box
        position="absolute"
        bottom={0}
        right={0}
        width={40}
        height={40}
        bgcolor="rgba(0,0,0,0)"
        cursor="se-resize"
        onMouseDown={handleMouseDown}
        display="flex"
        justifyContent="center"
        alignItems="center"
      />
      </Box>
      <Box width="100%" mt={1.5} display="flex" justifyContent="center">
          {cameraMode === 'initial' && (
            <Button 
              variant="contained" 
              onClick={handleTakePhoto}
            >
              Scan Item
            </Button>
          )}
        </Box>
        {cameraMode !== 'initial' && (
          <Box 
            width="480px" 
            height="360px" 
            mb={2} 
            sx={{ 
              borderRadius: '15px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {cameraMode === 'capture' && (
              <ImageCapture 
                onCapture={handleCapturePhoto} 
                isFrontCamera={isFrontCamera} 
                onFlipCamera={handleCameraFlip}
              />
            )}
            {cameraMode === 'preview' && <img src={capturedImage} alt="Captured item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </Box>
        )}
        {cameraMode === 'capture' && (
          <Box display="flex" justifyContent="center" mt={-0.5}>
            <Button 
              variant="contained" 
              onClick={() => {
                if (cameraMode === 'capture') {
                  const imageCaptureElement = document.querySelector('video');
                  if (imageCaptureElement) {
                    const canvas = document.createElement('canvas');
                    canvas.width = imageCaptureElement.videoWidth;
                    canvas.height = imageCaptureElement.videoHeight;
                    canvas.getContext('2d').drawImage(imageCaptureElement, 0, 0);
                    const imageDataUrl = canvas.toDataURL('image/jpeg');
                    handleCapturePhoto(imageDataUrl);
                  }
                }
              }}
              sx={{ 
                mr: 1,
              }}
            >
              Capture Photo
            </Button>
            <Button 
              variant="contained" 
              onClick={handleDone}
            >
              Done
            </Button>
          </Box>
        )}
        {cameraMode === 'preview' && (
          <Box display="flex" justifyContent="center" mt={-0.5}>
            <Button 
              variant="contained" 
              onClick={handleRetakePhoto}
              sx={{ 
                mr: 1,
              }}
            >
              Retake Photo
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUploadPhoto}
              sx={{ 
                mr: 1,
              }}
            >
              Upload
            </Button>
            <Button 
              variant="contained" 
              onClick={handleDone}
            >
              Done
            </Button>
          </Box>
        )}
      </Box>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          width={boxSize.width}
          mt={-0.5}
        >
        </Box>
      </Box>
      </>
      <Box 
        position="fixed" 
        top="20px" 
        right="20px" 
        zIndex="1000"
        display="flex"
        gap={2}
      >
        {user ? (
          <Button 
            variant="contained" 
            onClick={handleLogOut} 
            style={{ width: '85px', position: 'absolute', right: '0px' }}
          >
            Log Out
          </Button>
        ) : (
          <>
            <Button 
              variant="contained" 
              onClick={handleSignInClick} 
              style={{ width: '85px', position: 'absolute', right: '90px' }}
            >
              Sign Up
            </Button>
            <Button 
              variant="contained" 
              onClick={handleLogInClick} 
              style={{ width: '75px', position: 'absolute', right: '0px' }}
            >
              Log In
            </Button>
          </>
        )}
      </Box>

      <Dialog 
        open={isSignInDialogOpen} 
        onClose={() => {
          setIsSignInDialogOpen(false);
          resetAuthFields();
        }}
      >
        <DialogTitle>Sign Up</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleSignIn)}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleSignIn)}
          />
          {signUpError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {signUpError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => {
            setIsSignInDialogOpen(false);
            resetAuthFields();
          }}>Cancel</Button>
          <Button onClick={handleSignIn}>Sign Up</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={isLogInDialogOpen} 
        onClose={() => {
          setIsLogInDialogOpen(false);
          resetAuthFields();
        }}
      >
        <DialogTitle>Log In</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleLogIn)}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleLogIn)}
          />
          {logInError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {logInError}
            </Typography>
          )}
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pt: 0 }}>
          <Button
            onClick={handleForgotPasswordClick}
            sx={{ textTransform: 'none' }}
          >
            Forgot Password
          </Button>
          <Box>
            <Button onClick={() => {
              setIsLogInDialogOpen(false);
              resetAuthFields();
            }} sx={{ mr: 1 }}>Cancel</Button>
            <Button onClick={handleLogIn}>Log In</Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog 
        open={isForgotPasswordDialogOpen} 
        onClose={() => {
          setIsForgotPasswordDialogOpen(false);
          resetAuthFields();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your email to reset your password.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleForgotPassword)}
          />
          {forgotPasswordError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {forgotPasswordError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => {
            setIsForgotPasswordDialogOpen(false);
            resetAuthFields();
          }}>Cancel</Button>
          <Button onClick={handleForgotPassword}>Send Reset Mail</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
